import type { Type } from "@typespec/compiler";
import type { MutationNodeForType } from "./factory.js";
import { MutationNode } from "./mutation-node.js";
import { traceEdge } from "./tracer.js";

/** Callbacks implementing how a head's type reference follows a tail's lifecycle. */
export interface MutationEdgeOptions<THead extends Type, TTail extends Type> {
  /** Called by {@link HalfEdge.setTail} before constructing the full edge. */
  onTailCreation?: (args: {
    /** Newly supplied dependency, available for establishing reverse connections. */
    tail: MutationNodeForType<TTail>;
  }) => void;
  /** Updates the head's reference when the tail changes or is already mutated/synthetic at connection. */
  onTailMutation: (args: {
    /** Dependency whose current output should be reflected by the head. */
    tail: MutationNodeForType<TTail>;
  }) => void;
  /** Removes or substitutes the head's reference when the tail is deleted. */
  onTailDeletion: (args: {
    /** Deleted dependency; its output is not a usable value for the original slot. */
    tail: MutationNodeForType<TTail>;
  }) => void;
  /**
   * Called when the tail node is replaced with a new node.
   * @param args.oldTail - The original tail node that was replaced
   * @param args.newTail - The new tail node
   * @param args.head - The head node of this edge
   * @param args.reconnect - If true, the callback should create a new edge to newTail.
   *                    If false, an edge already exists and should not be recreated.
   */
  onTailReplaced: (args: {
    /** Previous dependency, used to remove old names or other slot metadata. */
    oldTail: MutationNodeForType<TTail>;
    /** Replacement dependency, which may have a different type kind. */
    newTail: MutationNodeForType<Type>;
    /** Dependent node whose reference must be updated. */
    head: MutationNodeForType<THead>;
    /** Whether this callback must establish a new edge to keep receiving changes. */
    reconnect: boolean;
  }) => void;
  /** Optionally transfers a dependency to a replacement head after the old edge is detached. */
  onHeadReplaced?: (args: {
    /** Head whose outgoing edge has been removed. */
    oldHead: MutationNodeForType<THead>;
    /** Replacement head, which may not support the same relationship. */
    newHead: MutationNodeForType<Type>;
    /** Dependency that the replacement head may reconnect to. */
    tail: MutationNodeForType<TTail>;
  }) => void;
}

/**
 * Directed reference from a dependent head to a dependency tail.
 * Tail lifecycle events invoke relationship-specific callbacks on the head.
 * Replacement detaches the old edge; callbacks own any reconnection.
 */
export class MutationEdge<THead extends Type, TTail extends Type> {
  /** Node containing the reference that depends on {@link tail}. */
  public head: MutationNode<THead>;
  /** Referenced node whose lifecycle this edge observes. */
  public tail: MutationNode<TTail>;
  #options: MutationEdgeOptions<THead, TTail>;
  #deleted: boolean = false;

  /**
   * Registers both ends and synchronizes an already mutated, synthetic, or
   * replaced tail. Unlike {@link HalfEdge.setTail}, does not call `onTailCreation`.
   */
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

  /** Constructs and registers a full edge with the same synchronization as the constructor. */
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

  /** Dispatches the mutation callback unless the edge or its head has been deleted. */
  tailMutated(): void {
    if (this.#deleted || this.head.isDeleted) return;
    traceEdge(this, "Tail mutated.");
    this.#options.onTailMutation({ tail: this.tail as any });
  }

  /** Dispatches the deletion callback unless the edge or its head has been deleted. */
  tailDeleted() {
    if (this.#deleted || this.head.isDeleted) return;
    traceEdge(this, "Tail deleted.");
    this.#options.onTailDeletion({ tail: this.tail as any });
  }

  /**
   * Detaches this edge and dispatches `onTailReplaced` with `reconnect: true`.
   * The old tail defaults to this edge's tail; this method does not retarget the edge.
   */
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

  /** Detaches this edge and lets `onHeadReplaced` optionally reconnect its dependency. */
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

  /** Formats the endpoint IDs for traces and debugging. */
  toString() {
    return `MutationEdge(head=${this.head.id}, tail=${this.tail.id})`;
  }
}

/** Node-level reference whose dependency is supplied once, when it becomes available. */
export class HalfEdge<THead extends Type, TTail extends Type> {
  /** Dependent node that starts the reference. */
  public head: MutationNode<THead>;
  /** Dependency, or `null` until {@link setTail} connects it. */
  public tail: MutationNode<TTail> | null;
  #options: MutationEdgeOptions<THead, TTail>;

  /** Defers registration of the edge and its lifecycle callbacks until a tail is supplied. */
  constructor(head: MutationNode<THead>, options: MutationEdgeOptions<THead, TTail>) {
    this.head = head;
    this.tail = null;
    this.#options = options;
  }

  /**
   * Calls `onTailCreation`, constructs a full edge, and returns it.
   * Throws if this half-edge has already been completed.
   */
  setTail(tail: MutationNode<TTail>): MutationEdge<THead, TTail> {
    if (this.tail) {
      throw new Error("HalfEdge already has a tail");
    }
    this.tail = tail;
    this.#options.onTailCreation?.({ tail: tail as any });
    return MutationEdge.create(this.head, this.tail, this.#options);
  }
}
