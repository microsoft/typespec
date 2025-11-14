import type { Model, ModelProperty, Type } from "@typespec/compiler";
import { MutationEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class ModelMutationNode extends MutationNode<Model> {
  readonly kind = "Model";

  traverse() {
    if (this.sourceType.baseModel) {
      const baseNode = this.subgraph.getNode(this.sourceType.baseModel);
      this.connectToBase(baseNode);
    }

    for (const [propName, prop] of this.sourceType.properties) {
      const propNode = this.subgraph.getNode(prop);
      this.connectProperty(propNode, propName);
    }

    if (this.sourceType.indexer) {
      const indexerNode = this.subgraph.getNode(this.sourceType.indexer.value);
      this.connectIndexerValue(indexerNode);
    }
  }

  connectToBase(baseNode: MutationNode<Model>) {
    MutationEdge.create(this, baseNode, {
      onTailMutation: () => {
        this.mutatedType!.baseModel = baseNode.mutatedType;
      },
      onTailDeletion: () => {
        this.mutatedType.baseModel = undefined;
      },
      onTailReplaced: (newTail) => {
        if (newTail.mutatedType.kind !== "Model") {
          throw new Error("Cannot replace base model with non-model type");
        }
        this.mutatedType.baseModel = newTail.mutatedType;
      },
    });
  }

  connectProperty(propNode: MutationNode<ModelProperty>, sourcePropName: string) {
    MutationEdge.create(this, propNode, {
      onTailMutation: () => {
        this.mutatedType.properties.delete(sourcePropName);
        this.mutatedType.properties.set(propNode.mutatedType.name, propNode.mutatedType);
      },
      onTailDeletion: () => {
        this.mutatedType.properties.delete(sourcePropName);
      },
      onTailReplaced: (newTail) => {
        if (newTail.mutatedType.kind !== "ModelProperty") {
          throw new Error("Cannot replace model property with non-model property type");
        }
        this.mutatedType.properties.delete(sourcePropName);
        this.mutatedType.properties.set(newTail.mutatedType.name, newTail.mutatedType);
      },
    });
  }

  connectIndexerValue(indexerNode: MutationNode<Type>) {
    MutationEdge.create(this, indexerNode, {
      onTailMutation: () => {
        if (this.mutatedType.indexer) {
          this.mutatedType.indexer = {
            key: this.mutatedType.indexer.key,
            value: indexerNode.mutatedType,
          };
        }
      },
      onTailDeletion: () => {
        if (this.mutatedType.indexer) {
          this.mutatedType.indexer = {
            key: this.mutatedType.indexer.key,
            value: this.$.intrinsic.any,
          };
        }
      },
      onTailReplaced: (newTail) => {
        if (this.mutatedType.indexer) {
          this.mutatedType.indexer = {
            key: this.mutatedType.indexer.key,
            value: newTail.mutatedType,
          };
        }
      },
    });
  }
}
