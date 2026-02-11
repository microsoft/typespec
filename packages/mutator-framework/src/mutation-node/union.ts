import type { Union, UnionVariant } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class UnionMutationNode extends MutationNode<Union> {
  readonly kind = "Union";

  startVariantEdge() {
    return new HalfEdge<Union, UnionVariant>(this, {
      onTailCreation: ({ tail }) => {
        tail.connectUnion(this);
      },
      onTailMutation: ({ tail }) => {
        this.mutate();
        this.mutatedType.variants.delete(tail.sourceType.name);
        this.mutatedType.variants.set(tail.mutatedType.name, tail.mutatedType);
      },
      onTailDeletion: ({ tail }) => {
        this.mutate();
        this.mutatedType.variants.delete(tail.sourceType.name);
      },
      onTailReplaced: ({ oldTail, newTail, head, reconnect }) => {
        if (newTail.mutatedType.kind !== "UnionVariant") {
          throw new Error("Cannot replace union variant with non-union variant type");
        }
        head.mutate();
        head.mutatedType.variants.delete(oldTail.sourceType.name);
        head.mutatedType.variants.set(newTail.mutatedType.name, newTail.mutatedType);
        if (reconnect) {
          head.connectVariant(newTail as MutationNode<UnionVariant>);
        }
      },
    });
  }

  connectVariant(variantNode: MutationNode<UnionVariant>) {
    this.startVariantEdge().setTail(variantNode);
  }
}
