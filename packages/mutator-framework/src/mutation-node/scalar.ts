import type { Scalar } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

/** Connection-key configuration shape; current node connection methods do not consume it. */
export interface ScalarConnectOptions {
  /** Key designated for the base scalar; callers must select that node explicitly. */
  baseScalar?: string;
}

/** Maintains a scalar's base reference through an explicitly connected scalar node. */
export class ScalarMutationNode extends MutationNode<Scalar> {
  /** Selects scalar-specific base connections. */
  readonly kind = "Scalar";

  /**
   * Starts a base reference that follows scalar changes, clears the base on
   * deletion, and rejects replacements that are not scalars.
   */
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

  /** Completes {@link startBaseScalarEdge} with the chosen base scalar node. */
  connectBaseScalar(baseScalar: MutationNode<Scalar>) {
    this.startBaseScalarEdge().setTail(baseScalar);
  }
}
