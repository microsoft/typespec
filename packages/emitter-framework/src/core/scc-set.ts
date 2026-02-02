import { shallowReactive } from "@alloy-js/core";

export type NestedArray<T> = T | NestedArray<T>[];

export interface SCCComponent<T> {
  /**
   * Nested array representation of the items that belong to this component.
   * Single-node components expose the item directly while cycles expose a nested array.
   */
  readonly value: NestedArray<T>;
  /** Components that this component depends on (outgoing edges). */
  readonly references: ReadonlySet<SCCComponent<T>>;
  /** Components that depend on this component (incoming edges). */
  readonly referencedBy: ReadonlySet<SCCComponent<T>>;
}

type Connector<T> = (item: T) => Iterable<T>;

export interface SCCSetOptions {
  /**
   * When true, every node reachable from an added node is automatically surfaced
   * in the public `items`/`components` lists without requiring an explicit add.
   */
  includeReachable?: boolean;
}

interface ComponentRecord<T> {
  nodes: NodeRecord<T>[];
  value: NestedArray<T>;
  size: number;
  view: ComponentView<T>;
}

interface ComponentView<T> extends SCCComponent<T> {
  readonly references: Set<SCCComponent<T>>;
  readonly referencedBy: Set<SCCComponent<T>>;
}

interface NodeRecord<T> {
  readonly item: T;
  readonly neighbors: Set<NodeRecord<T>>;
  readonly dependents: Set<NodeRecord<T>>;
  added: boolean;
  addedAt?: number;
  component?: ComponentRecord<T>;
  initialized: boolean;
}

interface RemovedComponent<T> {
  component: ComponentRecord<T>;
  index: number;
}

/**
 * Maintains a growing directed graph and exposes its strongly connected components (SCCs).
 *
 * The set incrementally applies Tarjan's algorithm so newly added nodes immediately update
 * the public `items` and `components` views. Both arrays are shallow reactive so observers
 * can hold references without re-fetching after each mutation.
 */
export class SCCSet<T> {
  /**
   * Flattened, topologically ordered view of every node that has been added to the set.
   * Nodes appear before dependents unless they belong to the same strongly connected component.
   */
  public readonly items: T[];

  /**
   * Ordered strongly connected components that mirror `items`. Each entry exposes its members along
   * with the components it depends on and the components that depend on it, enabling callers to walk
   * the connectivity graph directly from any component.
   */
  public readonly components: SCCComponent<T>[];

  readonly #nodes = new Map<T, NodeRecord<T>>();
  readonly #connector: Connector<T>;
  readonly #componentOrder: ComponentRecord<T>[] = [];
  #addCounter = 0;
  readonly #includeReachable: boolean;

  /**
   * Creates a new SCC set around the provided dependency connector function.
   * @param connector Maps each item to the items it depends on (outgoing edges).
   * @param options Controls automatic inclusion of reachable nodes.
   */
  constructor(connector: Connector<T>, options: SCCSetOptions = {}) {
    this.#connector = connector;
    this.items = shallowReactive<T[]>([]);
    this.components = shallowReactive<SCCComponent<T>[]>([]);
    this.#includeReachable = !!options.includeReachable;
  }

  /**
   * Adds an item to the graph and captures its outgoing connections via the connector.
   * Items can be referenced before they are added; they will only surface in the public
   * views once explicitly added.
   */
  public add(item: T): void {
    const node = this.#getOrCreateNode(item);
    if (node.added) {
      return;
    }

    node.added = true;
    node.addedAt = this.#addCounter++;
    this.#initializeNode(node, true);

    if (this.#includeReachable) {
      this.#autoAddReachable(node);
      this.#recomputeAll();
    } else {
      this.#integrateNode(node);
    }
  }

  /**
   * Adds multiple items and recomputes SCC ordering once at the end.
   */
  public addAll(items: Iterable<T>): void {
    const newlyAdded: NodeRecord<T>[] = [];
    for (const item of items) {
      const node = this.#getOrCreateNode(item);
      if (node.added) {
        continue;
      }
      node.added = true;
      node.addedAt = this.#addCounter++;
      this.#initializeNode(node, true);
      newlyAdded.push(node);
    }

    if (newlyAdded.length === 0) {
      return;
    }

    if (this.#includeReachable) {
      for (const node of newlyAdded) {
        this.#autoAddReachable(node);
      }
    }

    this.#recomputeAll();
  }

  /**
   * Recursively adds every node reachable from the starting node, initializing metadata as needed.
   */
  #autoAddReachable(start: NodeRecord<T>): void {
    const visited = new Set<NodeRecord<T>>([start]);
    const stack = [...start.neighbors];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      if (!current.added) {
        current.added = true;
        current.addedAt = this.#addCounter++;
        this.#initializeNode(current, true);
      }

      for (const neighbor of current.neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  /**
   * Retrieves the cached node for the provided item or materializes a new, uninitialized record.
   */
  #getOrCreateNode(item: T): NodeRecord<T> {
    let existing = this.#nodes.get(item);
    if (!existing) {
      existing = {
        item,
        neighbors: new Set<NodeRecord<T>>(),
        dependents: new Set<NodeRecord<T>>(),
        added: false,
        initialized: false,
      } satisfies NodeRecord<T>;
      this.#nodes.set(item, existing);
    }
    return existing;
  }

  /**
   * Runs the connector for the node to refresh its neighbors and dependent relationships.
   * @param force When true, existing neighbor edges are cleared before recomputing.
   */
  #initializeNode(node: NodeRecord<T>, force = false): void {
    if (!force && node.initialized) {
      return;
    }

    if (force || node.initialized) {
      for (const neighbor of node.neighbors) {
        neighbor.dependents.delete(node);
      }
      node.neighbors.clear();
    }

    const dependencies = this.#connector(node.item);
    node.initialized = true;
    for (const dependency of dependencies) {
      if (dependency === undefined) {
        throw new Error(
          `Connector returned undefined dependency while initializing ${String(node.item)}`,
        );
      }
      const neighbor = this.#getOrCreateNode(dependency);
      node.neighbors.add(neighbor);
      neighbor.dependents.add(node);
      if (!neighbor.added) {
        this.#initializeNode(neighbor);
      }
    }
  }

  /**
   * Inserts a node that was just added into the component ordering without recomputing the world.
   */
  #integrateNode(node: NodeRecord<T>): void {
    const forward = this.#collectReachable(node, (current) => current.neighbors);
    const backward = this.#collectReachable(node, (current) => current.dependents);
    const candidates = new Set<NodeRecord<T>>();
    for (const seen of forward) {
      if (backward.has(seen)) {
        candidates.add(seen);
      }
    }
    candidates.add(node);

    const orderedNodes = Array.from(candidates).sort(
      (left, right) => (left.addedAt ?? 0) - (right.addedAt ?? 0),
    );

    const dependencyComponents = this.#collectNeighboringComponents(
      orderedNodes,
      (nodeRecord) => nodeRecord.neighbors,
      candidates,
    );
    const dependentComponents = this.#collectNeighboringComponents(
      orderedNodes,
      (nodeRecord) => nodeRecord.dependents,
      candidates,
    );

    const dependentClosure = this.#collectDependentComponentClosure(orderedNodes, candidates);
    const sortedDependents = this.#sortComponentsTopologically(dependentClosure);

    const insertIndexBeforeRemoval = this.#computeInsertIndex(
      dependencyComponents,
      dependentComponents,
    );
    const componentsToRemove = new Set<ComponentRecord<T>>();
    for (const member of candidates) {
      if (member.component) {
        componentsToRemove.add(member.component);
      }
    }
    for (const component of dependentClosure) {
      componentsToRemove.add(component);
    }

    const removedComponents = this.#removeComponents(componentsToRemove);
    const newComponent = this.#createComponent(orderedNodes);
    const insertIndex = this.#adjustInsertIndex(insertIndexBeforeRemoval, removedComponents);
    this.#insertComponent(newComponent, insertIndex);

    let nextIndex = insertIndex + 1;
    for (const component of sortedDependents) {
      this.#insertComponent(component, nextIndex++);
    }

    this.#refreshComponentConnections();
  }

  /**
   * Walks the graph in the provided direction to find all reachable, added nodes.
   */
  #collectReachable(
    start: NodeRecord<T>,
    next: (node: NodeRecord<T>) => Iterable<NodeRecord<T>>,
  ): Set<NodeRecord<T>> {
    const visited = new Set<NodeRecord<T>>();
    const stack: NodeRecord<T>[] = [start];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current) || !current.added) {
        continue;
      }
      visited.add(current);
      for (const neighbor of next(current)) {
        if (neighbor.added && !visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
    return visited;
  }

  /**
   * Collects components adjacent to the provided nodes that are not part of an excluded set.
   */
  #collectNeighboringComponents(
    nodes: NodeRecord<T>[],
    next: (node: NodeRecord<T>) => Iterable<NodeRecord<T>>,
    excluded: Set<NodeRecord<T>>,
  ): Set<ComponentRecord<T>> {
    const components = new Set<ComponentRecord<T>>();
    for (const node of nodes) {
      for (const neighbor of next(node)) {
        if (!neighbor.added || excluded.has(neighbor) || !neighbor.component) {
          continue;
        }
        components.add(neighbor.component);
      }
    }
    return components;
  }

  /**
   * Computes the closure of components that depend (directly or indirectly) on the start nodes.
   */
  #collectDependentComponentClosure(
    startNodes: NodeRecord<T>[],
    excluded: Set<NodeRecord<T>>,
  ): Set<ComponentRecord<T>> {
    const closure = new Set<ComponentRecord<T>>();
    const visited = new Set<NodeRecord<T>>();
    const stack = [...startNodes];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      for (const dependent of current.dependents) {
        if (excluded.has(dependent) || visited.has(dependent)) {
          continue;
        }

        if (dependent.added && dependent.component) {
          if (!closure.has(dependent.component)) {
            closure.add(dependent.component);
            for (const member of dependent.component.nodes) {
              stack.push(member);
            }
          }
        } else {
          stack.push(dependent);
        }
      }
    }

    return closure;
  }

  /**
   * Sorts the provided components in topological order, falling back to insertion order on cycles.
   */
  #sortComponentsTopologically(components: Set<ComponentRecord<T>>): ComponentRecord<T>[] {
    if (components.size === 0) {
      return [];
    }

    const componentList = Array.from(components);
    const inDegree = new Map<ComponentRecord<T>, number>();
    const adjacency = new Map<ComponentRecord<T>, Set<ComponentRecord<T>>>();

    for (const component of componentList) {
      inDegree.set(component, 0);
      adjacency.set(component, new Set());
    }

    for (const component of componentList) {
      for (const node of component.nodes) {
        for (const dependent of node.dependents) {
          const dependentComponent = dependent.component;
          if (!dependentComponent || dependentComponent === component) {
            continue;
          }
          if (components.has(dependentComponent)) {
            if (!adjacency.get(component)!.has(dependentComponent)) {
              adjacency.get(component)!.add(dependentComponent);
              inDegree.set(dependentComponent, (inDegree.get(dependentComponent) ?? 0) + 1);
            }
          }
        }
      }
    }

    const queue = componentList
      .filter((component) => (inDegree.get(component) ?? 0) === 0)
      .sort((left, right) => this.#compareComponentAddedAt(left, right));
    const ordered: ComponentRecord<T>[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      ordered.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        const remaining = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, remaining);
        if (remaining === 0) {
          queue.push(neighbor);
          queue.sort((left, right) => this.#compareComponentAddedAt(left, right));
        }
      }
    }

    if (ordered.length !== components.size) {
      return componentList.sort((left, right) => this.#compareComponentAddedAt(left, right));
    }

    return ordered;
  }

  /**
   * Orders components by the earliest time any of their nodes were added to the set.
   */
  #compareComponentAddedAt(left: ComponentRecord<T>, right: ComponentRecord<T>): number {
    return this.#getComponentAddedAt(left) - this.#getComponentAddedAt(right);
  }

  /**
   * Returns the earliest add-counter value for nodes within the component.
   */
  #getComponentAddedAt(component: ComponentRecord<T>): number {
    return component.nodes.reduce(
      (min, node) => Math.min(min, node.addedAt ?? Number.POSITIVE_INFINITY),
      Number.POSITIVE_INFINITY,
    );
  }

  /**
   * Determines where a new component should be inserted so dependency ordering stays valid.
   */
  #computeInsertIndex(
    dependencies: Set<ComponentRecord<T>>,
    dependents: Set<ComponentRecord<T>>,
  ): number {
    const dependencyIndex = dependencies.size
      ? Math.max(...Array.from(dependencies, (component) => this.#getComponentIndex(component)))
      : -1;
    const lowerBound = dependencyIndex + 1;
    if (!dependents.size) {
      if (!dependencies.size) {
        return this.#componentOrder.length;
      }
      return Math.min(lowerBound, this.#componentOrder.length);
    }

    const upperBound = Math.min(
      ...Array.from(dependents, (component) => this.#getComponentIndex(component)),
    );
    if (upperBound < lowerBound) {
      return lowerBound;
    }
    return upperBound;
  }

  /**
   * Retrieves the current ordering index for the component, throwing if it is unknown.
   */
  #getComponentIndex(component: ComponentRecord<T>): number {
    const index = this.#componentOrder.indexOf(component);
    if (index === -1) {
      throw new Error("Component not found in order.");
    }
    return index;
  }

  /**
   * Calculates the position in `items` where the first element of a component at index would live.
   */
  #getItemsStartIndexForInsert(targetIndex: number): number {
    let start = 0;
    for (let i = 0; i < targetIndex; i++) {
      start += this.#componentOrder[i].size;
    }
    return start;
  }

  /**
   * Convenience helper for `getItemsStartIndexForInsert` that names the intent for existing indices.
   */
  #getItemsStartIndexForIndex(componentIndex: number): number {
    return this.#getItemsStartIndexForInsert(componentIndex);
  }

  /**
   * Removes the specified components from both the ordering list and flattened items array.
   * Returns metadata describing what was removed so later insertions can adjust their offsets.
   */
  #removeComponents(components: Set<ComponentRecord<T>>): RemovedComponent<T>[] {
    if (components.size === 0) {
      return [];
    }

    const indexed = Array.from(components, (component) => ({
      component,
      index: this.#getComponentIndex(component),
    })).sort((a, b) => b.index - a.index);

    const removed: RemovedComponent<T>[] = [];
    for (const { component, index } of indexed) {
      const startIndex = this.#getItemsStartIndexForIndex(index);
      this.#componentOrder.splice(index, 1);
      this.components.splice(index, 1);
      this.items.splice(startIndex, component.size);
      component.view.references.clear();
      component.view.referencedBy.clear();
      for (const node of component.nodes) {
        node.component = undefined;
      }
      removed.push({ component, index });
    }

    removed.sort((a, b) => a.index - b.index);
    return removed;
  }

  /**
   * Adjusts a desired insertion point to account for previously removed components.
   */
  #adjustInsertIndex(desiredIndex: number, removed: RemovedComponent<T>[]): number {
    let shift = 0;
    for (const removedComponent of removed) {
      if (removedComponent.index < desiredIndex) {
        shift++;
      }
    }
    return Math.max(0, desiredIndex - shift);
  }

  /**
   * Inserts a component into the ordering and mirrors the change in the public lists.
   */
  #insertComponent(component: ComponentRecord<T>, index: number): void {
    const startIndex = this.#getItemsStartIndexForInsert(index);
    for (const node of component.nodes) {
      node.component = component;
    }
    this.#componentOrder.splice(index, 0, component);
    this.components.splice(index, 0, component.view);
    const items = component.nodes.map((record) => record.item);
    this.items.splice(startIndex, 0, ...items);
  }

  /**
   * Builds a component record for the provided nodes and assigns the back-reference on each node.
   */
  #createComponent(nodes: NodeRecord<T>[]): ComponentRecord<T> {
    const value = this.#createComponentValue(nodes);
    const view: ComponentView<T> = {
      value,
      references: new Set<SCCComponent<T>>(),
      referencedBy: new Set<SCCComponent<T>>(),
    };
    const component: ComponentRecord<T> = {
      nodes,
      value,
      size: nodes.length,
      view,
    };
    for (const node of nodes) {
      node.component = component;
    }
    return component;
  }

  /**
   * Generates the structure stored in `components` for the given nodes (item vs. nested array).
   */
  #createComponentValue(nodes: NodeRecord<T>[]): NestedArray<T> {
    if (nodes.length === 1) {
      return nodes[0].item;
    }
    const items = nodes.map((record) => record.item);
    return shallowReactive(items) as NestedArray<T>;
  }

  /**
   * Rebuilds the complete SCC ordering from scratch using Tarjan's algorithm and updates outputs.
   */
  #recomputeAll(): void {
    const nodes = Array.from(this.#nodes.values()).filter((node) => node.added);
    for (const node of nodes) {
      node.component = undefined;
    }

    if (nodes.length === 0) {
      for (const component of this.#componentOrder) {
        component.view.references.clear();
        component.view.referencedBy.clear();
      }
      this.#componentOrder.length = 0;
      this.components.length = 0;
      this.items.length = 0;
      return;
    }

    const indexMap = new Map<NodeRecord<T>, number>();
    const lowlinkMap = new Map<NodeRecord<T>, number>();
    const stack: NodeRecord<T>[] = [];
    const onStack = new Set<NodeRecord<T>>();
    let index = 0;
    const components: ComponentRecord<T>[] = [];

    const stronglyConnect = (node: NodeRecord<T>): void => {
      indexMap.set(node, index);
      lowlinkMap.set(node, index);
      index++;
      stack.push(node);
      onStack.add(node);

      for (const neighbor of node.neighbors) {
        if (!neighbor.added) {
          continue;
        }
        if (!indexMap.has(neighbor)) {
          stronglyConnect(neighbor);
          lowlinkMap.set(node, Math.min(lowlinkMap.get(node)!, lowlinkMap.get(neighbor)!));
        } else if (onStack.has(neighbor)) {
          lowlinkMap.set(node, Math.min(lowlinkMap.get(node)!, indexMap.get(neighbor)!));
        }
      }

      if (lowlinkMap.get(node) === indexMap.get(node)) {
        const componentNodes: NodeRecord<T>[] = [];
        let member: NodeRecord<T>;
        do {
          member = stack.pop()!;
          onStack.delete(member);
          componentNodes.push(member);
        } while (member !== node);
        componentNodes.sort((left, right) => (left.addedAt ?? 0) - (right.addedAt ?? 0));
        const component = this.#createComponent(componentNodes);
        components.push(component);
      }
    };

    for (const node of nodes) {
      if (!indexMap.has(node)) {
        stronglyConnect(node);
      }
    }

    const adjacency = new Map<ComponentRecord<T>, Set<ComponentRecord<T>>>();
    const inDegree = new Map<ComponentRecord<T>, number>();
    for (const component of components) {
      adjacency.set(component, new Set());
      inDegree.set(component, 0);
    }

    for (const component of components) {
      for (const node of component.nodes) {
        const dependencyComponents = new Set<ComponentRecord<T>>();
        const visitedNodes = new Set<NodeRecord<T>>();
        for (const neighbor of node.neighbors) {
          this.#collectComponentDependencies(neighbor, dependencyComponents, visitedNodes);
        }
        for (const dependency of dependencyComponents) {
          if (dependency === component) {
            continue;
          }
          const dependents = adjacency.get(dependency)!;
          if (!dependents.has(component)) {
            dependents.add(component);
            inDegree.set(component, (inDegree.get(component) ?? 0) + 1);
          }
        }
      }
    }

    const queue = components
      .filter((component) => (inDegree.get(component) ?? 0) === 0)
      .sort((left, right) => this.#compareComponentAddedAt(left, right));
    const orderedComponents: ComponentRecord<T>[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      orderedComponents.push(current);
      for (const dependent of adjacency.get(current) ?? []) {
        const nextDegree = (inDegree.get(dependent) ?? 0) - 1;
        inDegree.set(dependent, nextDegree);
        if (nextDegree === 0) {
          queue.push(dependent);
          queue.sort((left, right) => this.#compareComponentAddedAt(left, right));
        }
      }
    }

    if (orderedComponents.length !== components.length) {
      orderedComponents.push(
        ...components
          .filter((component) => !orderedComponents.includes(component))
          .sort((left, right) => this.#compareComponentAddedAt(left, right)),
      );
    }

    this.#componentOrder.splice(0, this.#componentOrder.length, ...orderedComponents);
    this.components.splice(
      0,
      this.components.length,
      ...orderedComponents.map((component) => component.view),
    );
    const flatItems: T[] = [];
    for (const component of orderedComponents) {
      for (const node of component.nodes) {
        flatItems.push(node.item);
      }
    }
    this.items.splice(0, this.items.length, ...flatItems);

    this.#refreshComponentConnections();
  }

  /**
   * Traverses outward from a node to find components it ultimately depends on, even through
   * nodes that are not yet part of the public set.
   */
  #collectComponentDependencies(
    node: NodeRecord<T>,
    collected: Set<ComponentRecord<T>>,
    visited: Set<NodeRecord<T>>,
  ): void {
    if (visited.has(node)) {
      return;
    }
    visited.add(node);

    if (node.added) {
      if (node.component) {
        collected.add(node.component);
      }
      return;
    }

    for (const neighbor of node.neighbors) {
      this.#collectComponentDependencies(neighbor, collected, visited);
    }
  }

  /**
   * Updates each public component view so callers can traverse the component graph without
   * recomputing edges manually.
   */
  #refreshComponentConnections(): void {
    for (const component of this.#componentOrder) {
      component.view.references.clear();
      component.view.referencedBy.clear();
    }

    for (const component of this.#componentOrder) {
      for (const node of component.nodes) {
        for (const neighbor of node.neighbors) {
          if (!neighbor.added) {
            continue;
          }
          const neighborComponent = neighbor.component;
          if (!neighborComponent || neighborComponent === component) {
            continue;
          }
          const dependencyView = neighborComponent.view;
          component.view.references.add(dependencyView);
          dependencyView.referencedBy.add(component.view);
        }
      }
    }
  }
}
