import type { Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import type { MutationEngine } from "../mutation/mutation-engine.js";
import { mutationNodeFor, type MutationNodeForType } from "./factory.js";
import type { MutationEdge } from "./mutation-edge.js";
import { traceNode } from "./tracer.js";

let nextId = 0;

/** Identity and origin metadata used when constructing a mutation node. */
export interface MutationNodeOptions {
  /** Key distinguishing nodes for the same source type; defaults to `""`. */
  mutationKey?: string;
  /** Marks an introduced type so incoming connections propagate it even before cloning. */
  isSynthetic?: boolean;
}

/**
 * Tracks a source type and its output in a parallel type graph.
 *
 * The output initially aliases the source. The first {@link mutate} clones it
 * and notifies incoming reference edges, allowing dependent nodes to update.
 * Obtain nodes through {@link MutationEngine.getMutationNode} to share one node
 * per source type identity and key within an engine; direct construction is not cached.
 */
export abstract class MutationNode<T extends Type> {
  /** Type kind handled by this node's connection methods. */
  abstract readonly kind: string;

  /** Process-local sequential identifier used in diagnostic strings and traces. */
  id = nextId++;
  /** Original type used to initialize this node; not replaced when output changes. */
  sourceType: T;
  /** Current output: initially the source, then a clone, or `never` after deletion. */
  mutatedType: T;
  /** Whether this node has been cloned or designated as an already-mutated replacement. */
  isMutated: boolean = false;
  /** Whether connections must propagate this introduced type without waiting for a mutation. */
  isSynthetic: boolean = false;
  /** Whether {@link delete} has removed this node's contribution to its dependents. */
  isDeleted: boolean = false;
  /** Whether {@link replace} has redirected references to another node. */
  isReplaced: boolean = false;
  /** Successor created by {@link replace}, or `null` before replacement. */
  replacementNode: MutationNodeForType<Type> | null = null;
  /** If this node is a replacement for another node, this is the node it replaced */
  replacedNode: MutationNodeForType<Type> | null = null;
  /** References from dependent heads to this node as their tail. */
  inEdges: Set<MutationEdge<Type, T>> = new Set();
  /** References from this node as a head to the nodes it depends on. */
  outEdges: Set<MutationEdge<T, Type>> = new Set();
  /** Engine owning the node cache and typekit used for graph updates. */
  engine: MutationEngine<any>;
  /** Context key used with source type identity in the engine's node cache. */
  mutationKey: string;
  /** Type utilities from {@link engine}, used for cloning and fallback types. */
  $: Typekit;
  protected connected: boolean = false;

  #whenMutatedCallbacks: ((mutatedType: Type | null) => void)[] = [];

  /**
   * Initializes an uncached node whose output aliases `sourceNode`.
   * An omitted key is empty and an omitted synthetic flag is false.
   */
  constructor(
    subgraph: MutationEngine<any>,
    sourceNode: T,
    options: MutationNodeOptions | string = "",
  ) {
    this.engine = subgraph;
    this.$ = this.engine.$;
    this.sourceType = sourceNode;
    this.mutatedType = sourceNode;
    if (typeof options === "string") {
      this.mutationKey = options;
    } else {
      this.mutationKey = options.mutationKey ?? "";
      this.isSynthetic = options.isSynthetic ?? false;
    }

    traceNode(this, "Created.");
  }

  /** Registers an incoming reference; does not register it with the head. */
  addInEdge(edge: MutationEdge<Type, T>) {
    this.inEdges.add(edge);
  }

  /** Removes incoming-edge bookkeeping only; use {@link MutationEdge.delete} to detach both ends. */
  deleteInEdge(edge: MutationEdge<Type, T>) {
    this.inEdges.delete(edge);
  }

  /** Registers an outgoing dependency; does not register it with the tail. */
  addOutEdge(edge: MutationEdge<T, Type>) {
    this.outEdges.add(edge);
  }

  /** Removes outgoing-edge bookkeeping only; use {@link MutationEdge.delete} to detach both ends. */
  deleteOutEdge(edge: MutationEdge<T, Type>) {
    this.outEdges.delete(edge);
  }

  /**
   * Registers a callback for the first clone and for deletion (`null`).
   * Registration does not replay an earlier mutation. Later initializer calls
   * and replacement do not invoke these callbacks.
   */
  whenMutated(cb: (mutatedType: T | null) => void) {
    this.#whenMutatedCallbacks.push(cb as any);
  }

  /**
   * Clones on first use, runs the initializer, notifies callbacks and incoming
   * edges, then finishes the clone through the typekit.
   *
   * Subsequent calls run only the initializer on the existing output. Deleted
   * or replaced nodes ignore the call entirely.
   */
  mutate(initializeMutation?: (type: T) => void) {
    if (this.isDeleted || this.isReplaced) {
      traceNode(this, `Already deleted/replaced, skipping mutation.`);
      return;
    }

    if (this.isMutated) {
      traceNode(this, "Already mutated, running initialization");
      initializeMutation?.(this.mutatedType);
      return;
    }

    traceNode(this, "Mutating.");

    this.mutatedType = this.$.type.clone(this.sourceType);

    this.isMutated = true;
    initializeMutation?.(this.mutatedType);
    for (const cb of this.#whenMutatedCallbacks) {
      cb(this.mutatedType);
    }

    for (const edge of this.inEdges) {
      edge.tailMutated();
    }

    this.$.type.finishType(this.mutatedType);
  }

  /**
   * Marks this node deleted, calls mutation callbacks with `null`, sets its
   * output to `never`, and notifies incoming edges. Each relationship decides
   * whether to remove its slot, substitute a fallback, or delete its head.
   */
  delete() {
    traceNode(this, "Deleting.");

    this.isDeleted = true;

    for (const cb of this.#whenMutatedCallbacks) {
      cb(null);
    }

    this.mutatedType = this.$.intrinsic.never as T;

    for (const edge of this.inEdges) {
      edge.tailDeleted();
    }
  }

  /**
   * Replace this node with a new type. This creates a new mutation node for the
   * replacement type and updates all edges to point to the new node.
   *
   * When a node is replaced:
   * 1. A new mutation node is created for the replacement type
   * 2. The original node is marked as replaced and will ignore future mutations
   * 3. All out-edges (where this node is the head) are notified via `headReplaced`,
   *    which marks the edge so its callbacks no longer fire for the original node.
   *    The edge's `onHeadReplaced` callback is invoked, allowing the replacement
   *    node to establish its own connections to the tail nodes if needed.
   * 4. All in-edges (where this node is the tail) are notified via `tailReplaced`,
   *    which updates the edge to point to the replacement node and invokes the
   *    head's `onTailReplaced` callback.
   *
   * @param newType - The type to replace this node with
   * @returns The new mutation node for the replacement type
   */
  replace(newType: Type) {
    if (this.isReplaced) {
      return this;
    }

    traceNode(this, "Replacing.");

    // We need to make a new node because different types need to handle edge mutations differently.

    this.isReplaced = true;
    this.replacementNode = mutationNodeFor(this.engine, newType, this.mutationKey);
    // Set the back-reference so the replacement node knows what it replaced
    this.replacementNode.replacedNode = this as unknown as MutationNodeForType<Type>;
    // we don't need to do the clone stuff with this node, but we mark it as
    // mutated because we don't want to allow further mutations on it.
    this.replacementNode.isMutated = true;

    this.engine.replaceMutationNode(this, this.replacementNode);
    traceNode(this, "Calling head replaced");
    for (const edge of this.outEdges) {
      edge.headReplaced(this.replacementNode);
    }

    traceNode(this, "Calling tail replaced");
    for (const edge of this.inEdges) {
      edge.tailReplaced(this.replacementNode);
    }

    return this.replacementNode;
  }

  /** Formats the source name or kind, mutation key, and local ID for debugging. */
  toString() {
    return `MutationNode(${"name" in this.sourceType && typeof this.sourceType.name === "string" ? this.sourceType.name : this.kind}, key=${this.mutationKey}, id=${this.id})`;
  }
}
