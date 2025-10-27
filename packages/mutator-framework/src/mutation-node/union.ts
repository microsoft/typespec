import type { Union, UnionVariant } from "@typespec/compiler";
import { MutationEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class UnionMutationNode extends MutationNode<Union> {
  readonly kind = "Union";

  traverse(): void {
    for (const variant of this.sourceType.variants.values()) {
      const variantNode = this.subgraph.getNode(variant);
      this.connectVariant(variantNode, variant.name);
    }
  }

  connectVariant(variantNode: MutationNode<UnionVariant>, sourcePropName: string | symbol) {
    MutationEdge.create(this, variantNode, {
      onTailMutation: () => {
        this.mutatedType.variants.delete(sourcePropName);
        this.mutatedType.variants.set(variantNode.mutatedType.name, variantNode.mutatedType);
      },
      onTailDeletion: () => {
        this.mutatedType.variants.delete(sourcePropName);
      },
      onTailReplaced: (newTail) => {
        if (newTail.mutatedType.kind !== "UnionVariant") {
          throw new Error("Cannot replace union variant with non-union variant type");
        }
        this.mutatedType.variants.delete(sourcePropName);
        this.mutatedType.variants.set(newTail.mutatedType.name, newTail.mutatedType);
      },
    });
  }
}
