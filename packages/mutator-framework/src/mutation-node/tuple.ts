import type { Tuple, Type } from "@typespec/compiler";
import { MutationEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class TupleMutationNode extends MutationNode<Tuple> {
  readonly kind = "Tuple";
  #indexMap: number[] = [];

  traverse() {
    for (let i = 0; i < this.sourceType.values.length; i++) {
      const elemType = this.sourceType.values[i];
      const elemNode = this.subgraph.getNode(elemType);
      this.#indexMap[i] = i;
      this.connectElement(elemNode, i);
    }
  }

  connectElement(elemNode: MutationNode<Type>, index: number) {
    MutationEdge.create(this, elemNode, {
      onTailMutation: () => {
        this.mutatedType.values[this.#indexMap[index]] = elemNode.mutatedType;
      },
      onTailDeletion: () => {
        const spliceIndex = this.#indexMap[index];
        this.mutatedType.values.splice(spliceIndex, 1);
        for (let i = spliceIndex + 1; i < this.#indexMap.length; i++) {
          this.#indexMap[i]--;
        }
      },
      onTailReplaced: (newTail) => {
        this.mutatedType.values[this.#indexMap[index]] = newTail.mutatedType;
      },
    });
  }
}
