import type { Scalar } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export interface ScalarConnectOptions {
  /** Mutation key for the base scalar node. Defaults to this node's key. */
  baseScalar?: string;
}

export class ScalarMutationNode extends MutationNode<Scalar> {
  readonly kind = "Scalar";

  startBaseScalarEdge() {
    return new HalfEdge<Scalar, Scalar>(this, {
      onTailReplaced: ({ newTail, head, reconnect }) => {
        if (!head.$.scalar.is(newTail.mutatedType)) {
          throw new Error("Cannot replace base scalar with non-scalar type");
        }
        head.mutate();
        head.mutatedType.baseScalar = newTail.mutatedType;
        if (reconnect) {
          head.connectBaseScalar(newTail as MutationNode<Scalar>);
        }
      },
      onTailMutation: ({ tail }) => {
        this.mutate();
        this.mutatedType.baseScalar = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.mutate();
        this.mutatedType.baseScalar = undefined;
      },
    });
  }

  connectBaseScalar(baseScalar: MutationNode<Scalar>) {
    this.startBaseScalarEdge().setTail(baseScalar);
  }
}
