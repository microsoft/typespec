import type { Type, Union, UnionVariant } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

/** Connection-key configuration shape; current node connection methods do not consume it. */
export interface UnionVariantConnectOptions {
  /** Key designated for the underlying type; callers must select that node explicitly. */
  type?: string;
}

/** Maintains a variant's underlying type and containing-union references through explicit edges. */
export class UnionVariantMutationNode extends MutationNode<UnionVariant> {
  /** Selects variant-specific type and ownership connections. */
  readonly kind = "UnionVariant";

  /**
   * Starts a type reference that follows mutations and replacements of any kind.
   * Deleting the underlying type substitutes `any` rather than removing the variant.
   */
  startTypeEdge() {
    return new HalfEdge<UnionVariant, Type>(this, {
      onTailMutation: ({ tail }) => {
        this.mutate();
        this.mutatedType.type = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.mutate();
        this.mutatedType.type = this.$.intrinsic.any;
      },
      onTailReplaced: ({ newTail, head, reconnect }) => {
        head.mutate();
        head.mutatedType.type = newTail.mutatedType;
        if (reconnect) {
          head.connectType(newTail);
        }
      },
    });
  }

  /** Completes {@link startTypeEdge} with the chosen underlying type node. */
  connectType(typeNode: MutationNode<Type>) {
    this.startTypeEdge().setTail(typeNode);
  }

  /**
   * Starts the containing-union back-reference.
   * Union mutation updates the output's owner; union deletion or replacement
   * deletes this variant rather than moving it to a new owner.
   */
  startUnionEdge() {
    return new HalfEdge<UnionVariant, Union>(this, {
      onTailMutation: ({ tail }) => {
        this.mutate();
        this.mutatedType.union = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.delete();
      },
      onTailReplaced: ({ head }) => {
        head.delete();
      },
    });
  }

  /** Completes {@link startUnionEdge}; normally established by a union's variant connection. */
  connectUnion(unionNode: MutationNode<Union>) {
    this.startUnionEdge().setTail(unionNode);
  }
}
