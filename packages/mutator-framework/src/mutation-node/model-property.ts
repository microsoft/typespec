import type { Model, ModelProperty, Type } from "@typespec/compiler";
import { ModelPropertyMutationNode as SelfType } from "./model-property.js";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";
import { traceNode } from "./tracer.js";

export interface ModelPropertyConnectOptions {
  /** Mutation key for the property's type node. Defaults to this node's key. */
  typeMutationKey?: string;
}

export class ModelPropertyMutationNode extends MutationNode<ModelProperty> {
  readonly kind = "ModelProperty";

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

  connectType(typeNode: MutationNode<Type>) {
    this.startTypeEdge().setTail(typeNode);
  }

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

  connectModel(modelNode: MutationNode<Model>) {
    this.startModelEdge().setTail(modelNode);
  }
}
