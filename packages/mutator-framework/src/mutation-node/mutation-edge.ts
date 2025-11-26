import type { Type } from "@typespec/compiler";
import { MutationNode } from "./mutation-node.js";

export interface MutationEdgeOptions {
  onTailMutation: () => void;
  onTailDeletion: () => void;
  onTailReplaced: (newTail: MutationNode<Type>) => void;
}

export class MutationEdge<THead extends Type, TTail extends Type> {
  public head: MutationNode<THead>;
  public tail: MutationNode<TTail>;
  #options: MutationEdgeOptions;

  constructor(head: MutationNode<THead>, tail: MutationNode<TTail>, options: MutationEdgeOptions) {
    this.head = head;
    this.tail = tail;
    this.#options = options;
    this.tail.addInEdge(this);
  }

  static create(head: MutationNode<Type>, tail: MutationNode<Type>, options: MutationEdgeOptions) {
    return new MutationEdge(head, tail, options);
  }

  tailMutated(): void {
    this.head.mutate();
    this.#options.onTailMutation();
  }

  tailDeleted() {
    this.head.mutate();
    this.#options.onTailDeletion();
  }

  tailReplaced(newTail: MutationNode<TTail>) {
    this.head.mutate();
    this.tail.deleteInEdge(this);
    this.tail = newTail;
    this.tail.addInEdge(this);
    this.#options.onTailReplaced(newTail);
  }
}
