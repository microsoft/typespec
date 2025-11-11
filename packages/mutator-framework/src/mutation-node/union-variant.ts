import type { Type, Union, UnionVariant } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export interface UnionVariantConnectOptions {
  /** Mutation key for the variant's type node. Defaults to this node's key. */
  type?: string;
}

export class UnionVariantMutationNode extends MutationNode<UnionVariant> {
  readonly kind = "UnionVariant";

  startTypeEdge() {
    return new HalfEdge<UnionVariant, Type>(this, {
      onTailMutation: (tail) => {
        this.mutate();
        this.mutatedType.type = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.mutate();
        this.mutatedType.type = this.$.intrinsic.any;
      },
      onTailReplaced: (newTail) => {
        this.mutate();
        this.mutatedType.type = newTail.mutatedType;
      },
    });
  }

  connectType(typeNode: MutationNode<Type>) {
    this.startTypeEdge().setTail(typeNode);
  }

  startUnionEdge() {
    return new HalfEdge<UnionVariant, Union>(this, {
      onTailMutation: (tail) => {
        this.mutate();
        this.mutatedType.union = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.delete();
      },
      onTailReplaced: () => {
        this.delete();
      },
    });
  }

  connectUnion(unionNode: MutationNode<Union>) {
    this.startUnionEdge().setTail(unionNode);
  }
}
