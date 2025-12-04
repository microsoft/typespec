import type { MemberType, Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { mutationNodeFor, type MutationNodeForType } from "../mutation-node/factory.js";
import { MutationNode, type MutationNodeOptions } from "../mutation-node/mutation-node.js";
import { InterfaceMutation } from "./interface.js";
import { IntrinsicMutation } from "./intrinsic.js";
import { LiteralMutation } from "./literal.js";
import { ModelPropertyMutation } from "./model-property.js";
import { ModelMutation } from "./model.js";
import { Mutation } from "./mutation.js";
import { OperationMutation } from "./operation.js";

import { ScalarMutation } from "./scalar.js";
import { UnionVariantMutation } from "./union-variant.js";
import { UnionMutation } from "./union.js";

interface StronglyConnectedMutationsEntry {
  components: Mutation<any, any, any, any>[][];
  componentAdjacency: Map<number, Set<number>>;
  mutationToComponent: Map<Mutation<any, any, any, any>, number>;
  mutations: Set<Mutation<any, any, any, any>>;
}

export type MutationRegistry = Record<Type["kind"], Mutation<Type, any, any>>;

export interface DefaultMutationClasses<TCustomMutations extends CustomMutationClasses>
  extends MutationRegistry {
  Operation: OperationMutation<MutationOptions, TCustomMutations>;
  Interface: InterfaceMutation<MutationOptions, TCustomMutations>;
  Model: ModelMutation<TCustomMutations, MutationOptions>;
  Scalar: ScalarMutation<MutationOptions, TCustomMutations>;
  ModelProperty: ModelPropertyMutation<TCustomMutations, MutationOptions>;
  Union: UnionMutation<MutationOptions, TCustomMutations>;
  UnionVariant: UnionVariantMutation<MutationOptions, TCustomMutations>;
  String: LiteralMutation<MutationOptions, TCustomMutations>;
  Number: LiteralMutation<MutationOptions, TCustomMutations>;
  Boolean: LiteralMutation<MutationOptions, TCustomMutations>;
  Intrinsic: IntrinsicMutation<MutationOptions, TCustomMutations>;
}

export type CustomMutationClasses = Partial<MutationRegistry>;

export type WithDefaultMutations<TCustomMutationClasses extends CustomMutationClasses> =
  TCustomMutationClasses & DefaultMutationClasses<TCustomMutationClasses>;

export type MutationFor<
  TCustomMutations extends CustomMutationClasses,
  TKind extends Type["kind"] = Type["kind"],
> = WithDefaultMutations<TCustomMutations>[TKind];

export type Constructor<T = object> = new (...args: any[]) => T;
export type ConstructorsFor<T> = { [K in keyof T]: Constructor<T[K]> };
export type InstancesFor<T extends Record<string, new (...args: any[]) => any>> = {
  [K in keyof T]: InstanceType<T[K]>;
};

export interface InitialMutationContext<
  TSourceType extends Type,
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions = MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> {
  engine: TEngine;
  sourceType: TSourceType;
  referenceTypes: MemberType[];
  options: TOptions;
}

export interface CreateMutationContext {
  mutationKey: string;
}

export interface MutationContext<
  TSourceType extends Type,
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions = MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends InitialMutationContext<TSourceType, TCustomMutations, TOptions, TEngine>,
    CreateMutationContext {}

export interface MutationTraits {
  isSynthetic?: boolean;
}

/**
 * Orchestrates type mutations using custom and default mutation classes.
 */
export class MutationEngine<TCustomMutations extends CustomMutationClasses> {
  /** TypeSpec type utilities. */
  $: Typekit;

  // Map of Type -> (Map of options.cacheKey() -> Mutation)
  #mutationCache = new Map<Type, Map<string, MutationFor<TCustomMutations>>>();
  #seenMutationNodes = new WeakMap<Type, Map<string, MutationNode<Type>>>();
  #mutationAdjacency = new WeakMap<
    Mutation<any, any, any, any>,
    Set<Mutation<any, any, any, any>>
  >();
  #mutationStronglyConnectedComponents = new WeakMap<
    Mutation<any, any, any, any>,
    StronglyConnectedMutationsEntry
  >();
  #mutatorClasses: ConstructorsFor<MutationRegistry>;

  /**
   * Creates a mutation engine with optional custom mutation classes.
   * @param $ - TypeSpec type utilities
   * @param mutatorClasses - Custom mutation class constructors
   */
  constructor($: Typekit, mutatorClasses: ConstructorsFor<TCustomMutations>) {
    this.$ = $;
    this.#mutatorClasses = {
      Operation: mutatorClasses.Operation ?? OperationMutation,
      Interface: mutatorClasses.Interface ?? InterfaceMutation,
      Model: mutatorClasses.Model ?? ModelMutation,
      Scalar: mutatorClasses.Scalar ?? ScalarMutation,
      ModelProperty: mutatorClasses.ModelProperty ?? ModelPropertyMutation,
      Union: mutatorClasses.Union ?? UnionMutation,
      UnionVariant: mutatorClasses.UnionVariant ?? UnionVariantMutation,
      String: mutatorClasses.String ?? LiteralMutation,
      Number: mutatorClasses.Number ?? LiteralMutation,
      Boolean: mutatorClasses.Boolean ?? LiteralMutation,
      Intrinsic: mutatorClasses.Intrinsic ?? IntrinsicMutation,
    } as any;
  }

  /**
   * Gets or creates a mutation node for the given type and key.
   * @param type - Source type
   * @param mutationKey - Cache key for the node
   * @returns Mutation node for the type
   */
  getMutationNode<T extends Type>(
    type: T,
    options?: MutationNodeOptions | string,
  ): MutationNodeForType<T> {
    let keyMap = this.#seenMutationNodes.get(type);
    const mutationKey = typeof options === "string" ? options : (options?.mutationKey ?? "");
    if (keyMap) {
      const existingNode = keyMap.get(mutationKey);
      if (existingNode) {
        return existingNode as MutationNodeForType<T>;
      }
    } else {
      keyMap = new Map();
      this.#seenMutationNodes.set(type, keyMap);
    }

    const node = mutationNodeFor(this, type, options);
    keyMap.set(mutationKey, node);
    return node;
  }

  /**
   * Replaces one mutation node with another in the cache.
   * @param oldNode - Node to remove
   * @param newNode - Node to add
   */
  replaceMutationNode(oldNode: MutationNode<Type>, newNode: MutationNode<Type>) {
    const oldKeyMap = this.#seenMutationNodes.get(oldNode.sourceType);
    if (oldKeyMap) {
      oldKeyMap.delete(oldNode.mutationKey);
    }

    let newKeyMap = this.#seenMutationNodes.get(newNode.sourceType);
    if (!newKeyMap) {
      newKeyMap = new Map();
      this.#seenMutationNodes.set(newNode.sourceType, newKeyMap);
    }
    newKeyMap.set(newNode.mutationKey, newNode);
  }

  /**
   * Replaces a reference with a new type and mutates it.
   * @param reference - Original reference to replace
   * @param newType - New type to use
   * @param options - Mutation options
   * @param halfEdge - Optional half edge for tracking
   * @returns Mutation for the new type
   */
  replaceAndMutateReference<TType extends Type>(
    reference: MemberType,
    newType: TType,
    options: MutationOptions = new MutationOptions(),
    halfEdge?: MutationHalfEdge,
  ) {
    const { references } = resolveReference(reference);
    const mut = this.mutateWorker(newType, references, options, halfEdge, {
      isSynthetic: true,
    });
    return mut;
  }

  /**
   * Internal worker that creates or retrieves mutations with caching.
   */
  protected mutateWorker<TType extends Type>(
    type: TType,
    references: MemberType[],
    options: MutationOptions,
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationFor<TCustomMutations, TType["kind"]> {
    // initialize cache
    if (!this.#mutationCache.has(type)) {
      this.#mutationCache.set(type, new Map<string, MutationFor<TCustomMutations, Type["kind"]>>());
    }

    const byType = this.#mutationCache.get(type)!;
    const mutatorClass = this.#mutatorClasses[type.kind];
    if (!mutatorClass) {
      throw new Error("No mutator registered for type kind: " + type.kind);
    }

    const info = (mutatorClass as any).mutationInfo(
      this,
      type,
      references,
      options,
      halfEdge,
      traits,
    );
    if (info instanceof Mutation) {
      // Already a mutation, return it directly.
      // Type change mutations break types badly, but hopefully in general things "just work"?
      return info as any;
    }

    const key = info.mutationKey;
    if (byType.has(key)) {
      const existing = byType.get(key)! as any;
      halfEdge?.setTail(existing);
      if (!existing.isMutated) {
        existing.isMutated = true;
        existing.mutate();
      }
      return existing;
    }

    // TS doesn't like this abstract class here, but it will be a derivative
    // class in practice.
    const mutation = new (mutatorClass as any)(this, type, [], options, info);
    byType.set(key, mutation);
    mutation.isMutated = true;
    halfEdge?.setTail(mutation);
    mutation.mutate();
    return mutation;
  }

  /**
   * Mutates a type using registered mutation classes.
   * @param type - Type to mutate
   * @param options - Mutation options
   * @param halfEdge - Optional half edge for linking mutations to parent mutations
   * @returns Mutation for the type
   */
  mutate<TType extends Type>(
    type: TType,
    options: MutationOptions = new MutationOptions(),
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationFor<TCustomMutations, TType["kind"]> {
    return this.mutateWorker(type, [], options, halfEdge, traits);
  }

  /**
   * Mutates a type through a reference chain (e.g., ModelProperty or UnionVariant).
   * @param reference - Reference to mutate
   * @param options - Mutation options
   * @param halfEdge - Optional half edge for tracking
   * @returns Mutation for the referenced type
   */
  mutateReference(
    reference: MemberType,
    options: MutationOptions = new MutationOptions(),
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationFor<TCustomMutations> {
    const { referencedType, references } = resolveReference(reference);

    return this.mutateWorker(referencedType, references, options, halfEdge, traits) as any;
  }

  registerMutationEdge(head: Mutation<any, any, any, any>, tail: Mutation<any, any, any, any>) {
    let neighbors = this.#mutationAdjacency.get(head);
    if (!neighbors) {
      neighbors = new Set();
      this.#mutationAdjacency.set(head, neighbors);
    }
    if (neighbors.has(tail)) {
      return;
    }
    neighbors.add(tail);
    this.#onMutationGraphChanged(head);
  }

  getMutationStronglyConnectedComponents(
    root: Mutation<any, any, any, any>,
  ): Mutation<any, any, any, any>[][] {
    let entry = this.#mutationStronglyConnectedComponents.get(root);
    if (!entry) {
      entry = this.#buildMutationStronglyConnectedComponentsEntry(root);
    }
    return this.#collectMutationComponentsFromEntry(entry, root);
  }

  #onMutationGraphChanged(mutation: Mutation<any, any, any, any>) {
    const entry = this.#mutationStronglyConnectedComponents.get(mutation);
    if (entry) {
      this.#invalidateMutationStronglyConnectedComponents(entry);
    }
  }

  #buildMutationStronglyConnectedComponentsEntry(
    root: Mutation<any, any, any, any>,
  ): StronglyConnectedMutationsEntry {
    const indexMap = new Map<Mutation<any, any, any, any>, number>();
    const lowlinkMap = new Map<Mutation<any, any, any, any>, number>();
    const stack: Mutation<any, any, any, any>[] = [];
    const onStack = new Set<Mutation<any, any, any, any>>();
    let index = 0;
    const components: Mutation<any, any, any, any>[][] = [];
    const mutationToComponent = new Map<Mutation<any, any, any, any>, number>();

    const strongConnect = (mutation: Mutation<any, any, any, any>) => {
      indexMap.set(mutation, index);
      lowlinkMap.set(mutation, index);
      index++;
      stack.push(mutation);
      onStack.add(mutation);

      const neighbors = this.#mutationAdjacency.get(mutation);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!indexMap.has(neighbor)) {
            strongConnect(neighbor);
            lowlinkMap.set(
              mutation,
              Math.min(lowlinkMap.get(mutation)!, lowlinkMap.get(neighbor)!),
            );
          } else if (onStack.has(neighbor)) {
            lowlinkMap.set(mutation, Math.min(lowlinkMap.get(mutation)!, indexMap.get(neighbor)!));
          }
        }
      }

      if (lowlinkMap.get(mutation) === indexMap.get(mutation)) {
        const component: Mutation<any, any, any, any>[] = [];
        let member: Mutation<any, any, any, any>;
        do {
          member = stack.pop()!;
          onStack.delete(member);
          component.push(member);
        } while (member !== mutation);
        const componentIndex = components.length;
        components.push(component);
        for (const memberMutation of component) {
          mutationToComponent.set(memberMutation, componentIndex);
        }
      }
    };

    strongConnect(root);

    const componentAdjacency = new Map<number, Set<number>>();
    for (let i = 0; i < components.length; i++) {
      componentAdjacency.set(i, new Set());
    }

    for (const [mutation, componentIndex] of mutationToComponent.entries()) {
      const neighbors = this.#mutationAdjacency.get(mutation);
      if (!neighbors) continue;
      for (const neighbor of neighbors) {
        const neighborComponent = mutationToComponent.get(neighbor);
        if (neighborComponent === undefined || neighborComponent === componentIndex) {
          continue;
        }
        componentAdjacency.get(componentIndex)!.add(neighborComponent);
      }
    }

    const entry: StronglyConnectedMutationsEntry = {
      components,
      componentAdjacency,
      mutationToComponent,
      mutations: new Set(mutationToComponent.keys()),
    };

    for (const mutation of entry.mutations) {
      const previous = this.#mutationStronglyConnectedComponents.get(mutation);
      if (previous && previous !== entry) {
        previous.mutations.delete(mutation);
      }
      this.#mutationStronglyConnectedComponents.set(mutation, entry);
    }

    return entry;
  }

  #collectMutationComponentsFromEntry(
    entry: StronglyConnectedMutationsEntry,
    root: Mutation<any, any, any, any>,
  ): Mutation<any, any, any, any>[][] {
    const start = entry.mutationToComponent.get(root);
    if (start === undefined) {
      return [];
    }

    const result: Mutation<any, any, any, any>[][] = [];
    const visited = new Set<number>();
    const queue: number[] = [start];
    let cursor = 0;

    while (cursor < queue.length) {
      const componentIndex = queue[cursor++];
      if (visited.has(componentIndex)) {
        continue;
      }
      visited.add(componentIndex);
      result.push(entry.components[componentIndex]);
      const neighbors = entry.componentAdjacency.get(componentIndex);
      if (!neighbors) continue;
      for (const next of neighbors) {
        if (!visited.has(next)) {
          queue.push(next);
        }
      }
    }

    return result;
  }

  #invalidateMutationStronglyConnectedComponents(entry: StronglyConnectedMutationsEntry) {
    for (const mutation of entry.mutations) {
      const cachedEntry = this.#mutationStronglyConnectedComponents.get(mutation);
      if (cachedEntry === entry) {
        this.#mutationStronglyConnectedComponents.delete(mutation);
      }
    }
  }
}

function resolveReference(reference: MemberType) {
  const references: MemberType[] = [];
  let referencedType: Type = reference;
  while (referencedType.kind === "ModelProperty" || referencedType.kind === "UnionVariant") {
    references.push(referencedType);
    referencedType = referencedType.type;
  }
  return {
    referencedType,
    references,
  };
}

export class MutationOptions {
  get mutationKey(): string {
    return "";
  }
}

/**
 * Half-edge used to link mutations together. This represents the head-end of a
 * mutation. When the tail is created, it is set on the half-edge and allows the
 * head mutation to connect its nodes to the tail mutation.
 */
export class MutationHalfEdge<
  THead extends Mutation<any, any> = any,
  TTail extends Mutation<any, any> = any,
> {
  head: THead;
  tail: TTail | undefined;
  readonly kind: string;
  #onTailCreation: (tail: TTail) => void;

  constructor(kind: string, head: THead, onTailCreation: (tail: TTail) => void) {
    this.kind = kind;
    this.head = head;
    this.#onTailCreation = onTailCreation;
  }

  setTail(tail: TTail) {
    this.tail = tail;
    this.head.mutationEngine.registerMutationEdge(this.head, tail);
    this.#onTailCreation(tail);
  }
}
