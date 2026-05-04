import type { Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import type { MutationEngine } from "../mutation/mutation-engine.js";
import { mutationNodeFor, type MutationNodeForType } from "./factory.js";
import type { MutationEdge } from "./mutation-edge.js";
import { traceNode } from "./tracer.js";

/**
 * Mutation nodes represent a node in the type graph that can possibly be
 * mutated. Each mutation node tracks the source type, the mutated type, and the
 * edges coming from other mutation nodes which represent references to the
 * source type for this node.
 *
 * The mutated type is initially a reference to the source type. When a node is
 * mutated, the mutated type is initialized to a clone of the source type and
 * any mutations are applied. Then all nodes which reference this node are also
 * mutated, which will cause their mutated types to reference the mutated type
 * of this node.
 *
 * Each node is unique based on the source type and an optional mutation key.
 * The mutation key allows for multiple mutation nodes to exist for the same
 * source type, which is useful when a type's mutation depends on its context
 * such as how it is referenced.
 */

let nextId = 0;

export interface MutationNodeOptions {
  mutationKey?: string;
  isSynthetic?: boolean;
}

export abstract class MutationNode<T extends Type> {
  abstract readonly kind: string;

  id = nextId++;
  sourceType: T;
  mutatedType: T;
  isMutated: boolean = false;
  isSynthetic: boolean = false;
  isDeleted: boolean = false;
  isReplaced: boolean = false;
  replacementNode: MutationNodeForType<Type> | null = null;
  /** If this node is a replacement for another node, this is the node it replaced */
  replacedNode: MutationNodeForType<Type> | null = null;
  inEdges: Set<MutationEdge<Type, T>> = new Set();
  outEdges: Set<MutationEdge<T, Type>> = new Set();
  engine: MutationEngine<any>;
  mutationKey: string;
  $: Typekit;
  protected connected: boolean = false;

  #whenMutatedCallbacks: ((mutatedType: Type | null) => void)[] = [];

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

  addInEdge(edge: MutationEdge<Type, T>) {
    this.inEdges.add(edge);
  }

  deleteInEdge(edge: MutationEdge<Type, T>) {
    this.inEdges.delete(edge);
  }

  addOutEdge(edge: MutationEdge<T, Type>) {
    this.outEdges.add(edge);
  }

  deleteOutEdge(edge: MutationEdge<T, Type>) {
    this.outEdges.delete(edge);
  }

  whenMutated(cb: (mutatedType: T | null) => void) {
    this.#whenMutatedCallbacks.push(cb as any);
  }

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

  toString() {
    return `MutationNode(${"name" in this.sourceType && typeof this.sourceType.name === "string" ? this.sourceType.name : this.kind}, key=${this.mutationKey}, id=${this.id})`;
  }
}
