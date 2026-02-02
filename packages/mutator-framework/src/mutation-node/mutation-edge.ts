import type { Type } from "@typespec/compiler";
import type { MutationNodeForType } from "./factory.js";
import { MutationNode } from "./mutation-node.js";
import { traceEdge } from "./tracer.js";

export interface MutationEdgeOptions<THead extends Type, TTail extends Type> {
  onTailCreation?: (args: { tail: MutationNodeForType<TTail> }) => void;
  onTailMutation: (args: { tail: MutationNodeForType<TTail> }) => void;
  onTailDeletion: (args: { tail: MutationNodeForType<TTail> }) => void;
  /**
   * Called when the tail node is replaced with a new node.
   * @param args.oldTail - The original tail node that was replaced
   * @param args.newTail - The new tail node
   * @param args.head - The head node of this edge
   * @param args.reconnect - If true, the callback should create a new edge to newTail.
   *                    If false, an edge already exists and should not be recreated.
   */
  onTailReplaced: (args: {
    oldTail: MutationNodeForType<TTail>;
    newTail: MutationNodeForType<Type>;
    head: MutationNodeForType<THead>;
    reconnect: boolean;
  }) => void;
  onHeadReplaced?: (args: {
    oldHead: MutationNodeForType<THead>;
    newHead: MutationNodeForType<Type>;
    tail: MutationNodeForType<TTail>;
  }) => void;
}

export class MutationEdge<THead extends Type, TTail extends Type> {
  public head: MutationNode<THead>;
  public tail: MutationNode<TTail>;
  #options: MutationEdgeOptions<THead, TTail>;
  #deleted: boolean = false;

  constructor(
    head: MutationNode<THead>,
    tail: MutationNode<TTail>,
    options: MutationEdgeOptions<THead, TTail>,
  ) {
    this.head = head;
    this.tail = tail;
    this.#options = options;
    traceEdge(this, "Created.");
    this.tail.addInEdge(this);
    this.head.addOutEdge(this);

    // If the tail is a replacement node, notify the head about the replacement
    // so it can update its state (e.g., delete old property name, add new one).
    // We don't delete this edge since it's already correctly pointing to the new tail.
    // Pass reconnect=false since the edge already exists.
    if (this.tail.replacedNode) {
      traceEdge(this, "Tail is a replacement node, notifying head.");
      this.#options.onTailReplaced({
        oldTail: this.tail.replacedNode as any,
        newTail: this.tail as any,
        head: this.head as any,
        reconnect: false, // don't reconnect - edge already exists
      });
    } else if (this.tail.isMutated || this.tail.isSynthetic) {
      this.tailMutated();
    }

    if (this.tail.isReplaced) {
      this.tailReplaced(this.tail.replacementNode!);
    }
  }

  static create<THead extends Type, TTail extends Type>(
    head: MutationNode<THead>,
    tail: MutationNode<TTail>,
    options: MutationEdgeOptions<THead, TTail>,
  ) {
    return new MutationEdge(head, tail, options);
  }

  /**
   * Delete this edge, removing it from both the head's outEdges and tail's inEdges.
   * Once deleted, the edge will no longer propagate any mutations.
   */
  delete() {
    if (this.#deleted) return;
    traceEdge(this, "Deleted.");
    this.#deleted = true;
    this.head.deleteOutEdge(this);
    this.tail.deleteInEdge(this);
  }

  tailMutated(): void {
    if (this.#deleted || this.head.isDeleted) return;
    traceEdge(this, "Tail mutated.");
    this.#options.onTailMutation({ tail: this.tail as any });
  }

  tailDeleted() {
    if (this.#deleted || this.head.isDeleted) return;
    traceEdge(this, "Tail deleted.");
    this.#options.onTailDeletion({ tail: this.tail as any });
  }

  tailReplaced(newTail: MutationNode<Type>, oldTail?: MutationNode<TTail>) {
    if (this.#deleted || this.head.isDeleted) return;
    traceEdge(this, "Tail replaced with " + newTail.id);
    const actualOldTail = oldTail ?? this.tail;
    const head = this.head;
    // Delete this edge - the onTailReplaced callback is responsible for
    // creating a new edge if the head node needs to track the new tail's mutations
    this.delete();
    this.#options.onTailReplaced({
      oldTail: actualOldTail as any,
      newTail: newTail as any,
      head: head as any,
      reconnect: true,
    });
  }

  headReplaced(newHead: MutationNode<Type>) {
    if (this.#deleted || this.tail.isDeleted) return;
    traceEdge(this, "Head replaced with " + newHead.id);
    const oldHead = this.head;
    const tail = this.tail;
    // Delete this edge - the onHeadReplaced callback is responsible for
    // creating a new edge if the replacement node needs to track tail mutations
    this.delete();
    this.#options.onHeadReplaced?.({
      oldHead: oldHead as any,
      newHead: newHead as any,
      tail: tail as any,
    });
  }

  toString() {
    return `MutationEdge(head=${this.head.id}, tail=${this.tail.id})`;
  }
}

export class HalfEdge<THead extends Type, TTail extends Type> {
  public head: MutationNode<THead>;
  public tail: MutationNode<TTail> | null;
  #options: MutationEdgeOptions<THead, TTail>;

  constructor(head: MutationNode<THead>, options: MutationEdgeOptions<THead, TTail>) {
    this.head = head;
    this.tail = null;
    this.#options = options;
  }

  setTail(tail: MutationNode<TTail>): MutationEdge<THead, TTail> {
    if (this.tail) {
      throw new Error("HalfEdge already has a tail");
    }
    this.tail = tail;
    this.#options.onTailCreation?.({ tail: tail as any });
    return MutationEdge.create(this.head, this.tail, this.#options);
  }
}
