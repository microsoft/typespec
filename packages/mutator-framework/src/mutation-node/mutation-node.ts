import type { MemberType, Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { mutationNodeFor, type MutationNodeForType } from "./factory.js";
import type { MutationEdge } from "./mutation-edge.js";
import type { MutationSubgraph } from "./mutation-subgraph.js";

let nextId = 0;

export abstract class MutationNode<T extends Type> {
  abstract readonly kind: string;

  id = nextId++;
  sourceType: T;
  mutatedType: T;
  isMutated: boolean = false;
  isDeleted: boolean = false;
  isReplaced: boolean = false;
  replacementNode: MutationNodeForType<Type> | null = null;
  inEdges: Set<MutationEdge<Type, Type>> = new Set();
  subgraph: MutationSubgraph;
  referenceType: MemberType | null = null;
  $: Typekit;

  #whenMutatedCallbacks: ((mutatedType: Type | null) => void)[] = [];

  constructor(subgraph: MutationSubgraph, sourceNode: T) {
    this.subgraph = subgraph;
    this.$ = this.subgraph.engine.$;
    this.sourceType = sourceNode;
    this.mutatedType = sourceNode;
  }

  abstract traverse(): void;

  addInEdge(edge: MutationEdge<Type, Type>) {
    this.inEdges.add(edge);
  }

  deleteInEdge(edge: MutationEdge<Type, Type>) {
    this.inEdges.delete(edge);
  }

  whenMutated(cb: (mutatedType: T | null) => void) {
    this.#whenMutatedCallbacks.push(cb as any);
  }

  mutate(initializeMutation?: (type: T) => void) {
    if (this.isMutated || this.isDeleted || this.isReplaced) {
      return;
    }

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
    if (this.isMutated || this.isDeleted || this.isReplaced) {
      return;
    }

    this.isDeleted = true;

    for (const cb of this.#whenMutatedCallbacks) {
      cb(null);
    }

    this.mutatedType = this.$.intrinsic.never as T;

    for (const edge of this.inEdges) {
      edge.tailDeleted();
    }
  }

  replace(newType: Type) {
    if (this.isMutated || this.isDeleted || this.isReplaced) {
      return this;
    }

    // We need to make a new node because different types need to handle edge mutations differently.

    this.isReplaced = true;
    this.replacementNode = mutationNodeFor(this.subgraph, newType);
    this.replacementNode.traverse();
    // we don't need to do the clone stuff with this node, but we mark it as
    // mutated because we don't want to allow further mutations on it.
    this.replacementNode.isMutated = true;

    if (this.referenceType) {
      this.subgraph.replaceReferenceNode(this.referenceType, this.replacementNode);
    } else {
      this.subgraph.replaceNode(this, this.replacementNode);
    }

    for (const edge of this.inEdges) {
      edge.tailReplaced(this.replacementNode);
    }

    return this.replacementNode;
  }
}
