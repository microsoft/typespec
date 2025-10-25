import type { Type, UnionVariant } from "@typespec/compiler";
import { MutationEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class UnionVariantMutationNode extends MutationNode<UnionVariant> {
  readonly kind = "UnionVariant";

  traverse() {
    const typeNode = this.subgraph.getNode(this.sourceType.type);
    this.connectType(typeNode);
  }

  connectType(typeNode: MutationNode<Type>) {
    MutationEdge.create(this, typeNode, {
      onTailMutation: () => {
        this.mutatedType.type = typeNode.mutatedType;
      },
      onTailDeletion: () => {
        this.mutatedType.type = this.$.intrinsic.any;
      },
      onTailReplaced: (newTail) => {
        this.mutatedType.type = newTail.mutatedType;
      },
    });
  }
}
