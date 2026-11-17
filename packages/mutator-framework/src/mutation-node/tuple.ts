import type { Tuple, Type } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

/** Connection-key configuration shape; current node connection methods do not consume it. */
export interface TupleConnectOptions {
  /** Keys designated by element index; callers must select those nodes explicitly. */
  elements?: string[];
}

/** Updates connected tuple elements, tracking their positions as elements are removed. */
export class TupleMutationNode extends MutationNode<Tuple> {
  /** Selects tuple-specific positional connections. */
  readonly kind = "Tuple";
  #indexMap: number[] = [];

  /**
   * Starts a reference for a zero-based element position.
   * Mutation or replacement updates the element; deletion splices it out and
   * shifts tracked later positions. Establish connections before deleting elements.
   */
  startElementEdge(index: number) {
    this.#indexMap[index] = index;
    return new HalfEdge<Tuple, Type>(this, {
      onTailMutation: ({ tail }) => {
        this.mutate();
        this.mutatedType.values[this.#indexMap[index]] = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.mutate();
        const spliceIndex = this.#indexMap[index];
        this.mutatedType.values.splice(spliceIndex, 1);
        for (let i = spliceIndex + 1; i < this.#indexMap.length; i++) {
          this.#indexMap[i]--;
        }
      },
      onTailReplaced: ({ newTail, head, reconnect }) => {
        head.mutate();
        head.mutatedType.values[this.#indexMap[index]] = newTail.mutatedType;
        if (reconnect) {
          head.connectElement(newTail, index);
        }
      },
    });
  }

  /** Completes {@link startElementEdge} for the chosen node and original element index. */
  connectElement(elemNode: MutationNode<Type>, index: number) {
    this.startElementEdge(index).setTail(elemNode);
  }
}
