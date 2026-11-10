import type { Model, ModelProperty, Type } from "@typespec/compiler";
import { ModelPropertyMutationNode as SelfType } from "./model-property.js";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";
import { traceNode } from "./tracer.js";

/** Connection-key configuration shape; current node connection methods do not consume it. */
export interface ModelPropertyConnectOptions {
  /** Key designated for the underlying type; callers must select that node explicitly. */
  typeMutationKey?: string;
}

/** Maintains a property's underlying type and containing-model references through explicit edges. */
export class ModelPropertyMutationNode extends MutationNode<ModelProperty> {
  /** Selects property-specific connections independently of a replacement node's kind. */
  readonly kind = "ModelProperty";

  /**
   * Starts a type reference that follows mutations and replacements of any kind.
   * Deletion substitutes `any`. Replacing this property with another property
   * transfers the type connection to the replacement.
   */
  startTypeEdge() {
    return new HalfEdge<ModelProperty, Type>(this, {
      onTailMutation: ({ tail }) => {
        traceNode(this, "Model property type mutated.");
        this.mutate();
        this.mutatedType.type = tail.mutatedType;
      },
      onTailDeletion: (_args) => {
        this.mutate();
        this.mutatedType.type = this.$.intrinsic.any;
      },
      onTailReplaced: ({ newTail, head, reconnect }) => {
        head.mutate();
        head.mutatedType.type = newTail.mutatedType;
        if (reconnect) {
          (head as ModelPropertyMutationNode).connectType(newTail);
        }
      },
      onHeadReplaced: ({ newHead, tail }) => {
        // When this edge's head is replaced, have the new head establish
        // its own connection to the tail so it receives future mutations
        if (newHead instanceof SelfType) {
          (newHead as ModelPropertyMutationNode).connectType(tail);
        }
      },
    });
  }

  /** Completes {@link startTypeEdge} with the chosen underlying type node. */
  connectType(typeNode: MutationNode<Type>) {
    this.startTypeEdge().setTail(typeNode);
  }

  /**
   * Starts the containing-model back-reference.
   * Model changes update the output's owner; model deletion or replacement
   * deletes this property rather than moving it to a new owner.
   */
  startModelEdge() {
    return new HalfEdge<ModelProperty, Model>(this, {
      onTailMutation: ({ tail }) => {
        traceNode(this, "Model property model mutated.");
        this.mutate();
        this.mutatedType.model = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.delete();
      },
      onTailReplaced: ({ head }) => {
        head.delete();
      },
    });
  }

  /** Completes {@link startModelEdge}; normally established by a model's property connection. */
  connectModel(modelNode: MutationNode<Model>) {
    this.startModelEdge().setTail(modelNode);
  }
}
