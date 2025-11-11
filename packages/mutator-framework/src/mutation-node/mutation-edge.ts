import type { Type } from "@typespec/compiler";
import type { MutationNodeForType } from "./factory.js";
import { MutationNode } from "./mutation-node.js";
import { traceEdge } from "./tracer.js";

export interface MutationEdgeOptions<TTAil extends Type> {
  onTailCreation?: (tail: MutationNodeForType<TTAil>) => void;
  onTailMutation: (tail: MutationNodeForType<TTAil>) => void;
  onTailDeletion: (tail: MutationNodeForType<TTAil>) => void;
  onTailReplaced: (oldTail: MutationNodeForType<TTAil>, newTail: MutationNodeForType<Type>) => void;
}

export class MutationEdge<THead extends Type, TTail extends Type> {
  public head: MutationNode<THead>;
  public tail: MutationNode<TTail>;
  #options: MutationEdgeOptions<TTail>;

  constructor(
    head: MutationNode<THead>,
    tail: MutationNode<TTail>,
    options: MutationEdgeOptions<TTail>,
  ) {
    this.head = head;
    this.tail = tail;
    this.#options = options;
    traceEdge(this, "Created.");
    this.tail.addInEdge(this);

    if (this.tail.isMutated) {
      this.tailMutated();
    }

    if (this.tail.isReplaced) {
      this.tailReplaced(this.tail.replacementNode!);
    }
  }

  static create<THead extends Type, TTail extends Type>(
    head: MutationNode<THead>,
    tail: MutationNode<TTail>,
    options: MutationEdgeOptions<TTail>,
  ) {
    return new MutationEdge(head, tail, options);
  }

  tailMutated(): void {
    if (this.head.isDeleted) return;
    traceEdge(this, "Tail mutated.");
    this.#options.onTailMutation(this.tail as any);
  }

  tailDeleted() {
    if (this.head.isDeleted) return;
    traceEdge(this, "Tail deleted.");
    this.#options.onTailDeletion(this.tail as any);
  }

  tailReplaced(newTail: MutationNode<Type>) {
    if (this.head.isDeleted) return;
    traceEdge(this, "Tail replaced.");
    this.tail.deleteInEdge(this);
    this.tail = newTail as any;
    this.tail.addInEdge(this);
    this.#options.onTailReplaced(this.tail as any, newTail as any);
  }

  toString() {
    return `MutationEdge(head=${this.head.id}, tail=${this.tail.id})`;
  }
}

export class HalfEdge<THead extends Type, TTail extends Type> {
  public head: MutationNode<THead>;
  public tail: MutationNode<TTail> | null;
  #options: MutationEdgeOptions<TTail>;

  constructor(head: MutationNode<THead>, options: MutationEdgeOptions<TTail>) {
    this.head = head;
    this.tail = null;
    this.#options = options;
  }

  setTail(tail: MutationNode<TTail>): MutationEdge<THead, TTail> {
    if (this.tail) {
      throw new Error("HalfEdge already has a tail");
    }
    this.tail = tail;
    this.#options.onTailCreation?.(tail as any);
    return MutationEdge.create(this.head, this.tail, this.#options);
  }
}
