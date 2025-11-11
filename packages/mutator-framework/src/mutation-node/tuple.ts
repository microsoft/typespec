import type { Tuple, Type } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export interface TupleConnectOptions {
  /** Mutation keys for element nodes, keyed by index. Defaults to this node's key for all. */
  elements?: string[];
}

export class TupleMutationNode extends MutationNode<Tuple> {
  readonly kind = "Tuple";
  #indexMap: number[] = [];

  startElementEdge(index: number) {
    this.#indexMap[index] = index;
    return new HalfEdge<Tuple, Type>(this, {
      onTailMutation: (tail) => {
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
      onTailReplaced: (newTail) => {
        this.mutate();
        this.mutatedType.values[this.#indexMap[index]] = newTail.mutatedType;
      },
    });
  }

  connectElement(elemNode: MutationNode<Type>, index: number) {
    this.startElementEdge(index).setTail(elemNode);
  }
}
