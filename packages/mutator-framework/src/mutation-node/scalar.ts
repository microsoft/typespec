import type { Scalar } from "@typespec/compiler";
import { MutationEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class ScalarMutationNode extends MutationNode<Scalar> {
  readonly kind = "Scalar";

  traverse() {
    if (this.sourceType.baseScalar) {
      const baseScalarNode = this.subgraph.getNode(this.sourceType.baseScalar);
      this.connectBaseScalar(baseScalarNode);
    }
  }

  connectBaseScalar(baseScalar: MutationNode<Scalar>) {
    MutationEdge.create(this, baseScalar, {
      onTailReplaced: (newTail) => {
        if (!this.$.scalar.is(newTail.mutatedType)) {
          throw new Error("Cannot replace base scalar with non-scalar type");
        }

        this.mutatedType.baseScalar = newTail.mutatedType;
      },
      onTailMutation: () => {
        this.mutatedType.baseScalar = baseScalar.mutatedType;
      },
      onTailDeletion: () => {
        this.mutatedType.baseScalar = undefined;
      },
    });
  }
}
