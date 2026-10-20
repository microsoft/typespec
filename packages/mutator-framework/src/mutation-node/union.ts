import type { Union, UnionVariant } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

/** Maintains a union's variant map through explicit variant connections. */
export class UnionMutationNode extends MutationNode<Union> {
  /** Selects union-specific variant connections. */
  readonly kind = "Union";

  /**
   * Starts a variant reference and establishes the variant's union back-reference.
   * Renames replace source-name entries, deletion removes them, and replacements
   * must remain union variants. The union is cloned when its map needs updating.
   */
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

  /** Connects a variant and its union back-reference via {@link startVariantEdge}. */
  connectVariant(variantNode: MutationNode<UnionVariant>) {
    this.startVariantEdge().setTail(variantNode);
  }
}
