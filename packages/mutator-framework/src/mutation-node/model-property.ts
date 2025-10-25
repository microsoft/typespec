import type { ModelProperty, Type } from "@typespec/compiler";
import { MutationEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class ModelPropertyMutationNode extends MutationNode<ModelProperty> {
  readonly kind = "ModelProperty";
  #referenceMutated = false;

  traverse() {
    const typeNode = this.subgraph.getNode(this.sourceType.type);
    const referenceNode = this.subgraph.getReferenceNode(this.sourceType);

    this.connectType(typeNode);
    this.connectReference(referenceNode);
  }

  connectReference(referenceNode: MutationNode<Type>) {
    MutationEdge.create(this, referenceNode, {
      onTailMutation: () => {
        this.#referenceMutated = true;
        this.mutatedType.type = referenceNode.mutatedType;
      },
      onTailDeletion: () => {
        this.#referenceMutated = true;
        this.mutatedType.type = this.$.intrinsic.any;
      },
      onTailReplaced: (newTail) => {
        this.#referenceMutated = true;
        this.mutatedType.type = newTail.mutatedType;
      },
    });
  }

  connectType(typeNode: MutationNode<Type>) {
    MutationEdge.create(this, typeNode, {
      onTailMutation: () => {
        if (this.#referenceMutated) {
          return;
        }
        this.mutatedType.type = typeNode.mutatedType;
      },
      onTailDeletion: () => {
        if (this.#referenceMutated) {
          return;
        }
        this.mutatedType.type = this.$.intrinsic.any;
      },
      onTailReplaced: (newTail) => {
        this.mutatedType.type = newTail.mutatedType;
      },
    });
  }
}
