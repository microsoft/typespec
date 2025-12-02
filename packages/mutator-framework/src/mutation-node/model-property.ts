import type { Model, ModelProperty, Type } from "@typespec/compiler";
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
      onTailMutation: (tail) => {
        traceNode(this, "Model property type mutated.");
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

  startModelEdge() {
    return new HalfEdge<ModelProperty, Model>(this, {
      onTailMutation: (tail) => {
        traceNode(this, "Model property model mutated.");
        this.mutate();
        this.mutatedType.model = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.delete();
      },
      onTailReplaced: () => {
        this.delete();
      },
    });
  }

  connectModel(modelNode: MutationNode<Model>) {
    this.startModelEdge().setTail(modelNode);
  }
}
