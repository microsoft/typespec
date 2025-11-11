import type { Model, ModelProperty, Scalar, Type } from "@typespec/compiler";
import type { ModelPropertyMutationNode } from "./model-property.js";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export interface ModelConnectOptions {
  /** Mutation key for the base model node. Defaults to this node's key. */
  baseModel?: string;
  /** Mutation key for the indexer value node. Defaults to this node's key. */
  indexerValue?: string;
}

export class ModelMutationNode extends MutationNode<Model> {
  readonly kind = "Model";
  startBaseModelEdge() {
    return new HalfEdge<Model, Model>(this, {
      onTailMutation: (tail) => {
        this.mutate();
        this.mutatedType!.baseModel = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.mutate();
        this.mutatedType.baseModel = undefined;
      },
      onTailReplaced: (newTail) => {
        if (newTail.mutatedType.kind !== "Model") {
          throw new Error("Cannot replace base model with non-model type");
        }
        this.mutate();
        this.mutatedType.baseModel = newTail.mutatedType;
      },
    });
  }
  connectBase(baseNode: MutationNode<Model>) {
    this.startBaseModelEdge().setTail(baseNode);
  }

  startPropertyEdge() {
    return new HalfEdge<Model, ModelProperty>(this, {
      onTailCreation: (tail) => {
        tail.connectModel(this);
      },
      onTailMutation: (tail) => {
        this.mutate();
        this.mutatedType.properties.delete(tail.sourceType.name);
        this.mutatedType.properties.set(tail.mutatedType.name, tail.mutatedType);
      },
      onTailDeletion: (tail) => {
        this.mutate();
        this.mutatedType.properties.delete(tail.sourceType.name);
      },
      onTailReplaced: (tail, newTail) => {
        if (newTail.mutatedType.kind !== "ModelProperty") {
          throw new Error("Cannot replace model property with non-model property type");
        }
        this.mutate();
        this.mutatedType.properties.delete(tail.sourceType.name);
        this.mutatedType.properties.set(newTail.mutatedType.name, newTail.mutatedType);
      },
    });
  }

  connectProperty(propNode: ModelPropertyMutationNode) {
    this.startPropertyEdge().setTail(propNode);
  }

  startIndexerValueEdge() {
    return new HalfEdge<Model, Type>(this, {
      onTailMutation: (tail) => {
        this.mutate();
        if (this.mutatedType.indexer) {
          this.mutatedType.indexer = {
            key: this.mutatedType.indexer.key,
            value: tail.mutatedType,
          };
        }
      },
      onTailDeletion: () => {
        this.mutate();
        if (this.mutatedType.indexer) {
          this.mutatedType.indexer = {
            key: this.mutatedType.indexer.key,
            value: this.$.intrinsic.any,
          };
        }
      },
      onTailReplaced: (newTail) => {
        this.mutate();
        if (this.mutatedType.indexer) {
          this.mutatedType.indexer = {
            key: this.mutatedType.indexer.key,
            value: newTail.mutatedType,
          };
        }
      },
    });
  }

  startIndexerKeyEdge() {
    return new HalfEdge<Model, Scalar>(this, {
      onTailMutation: (tail) => {
        this.mutate();
        if (this.mutatedType.indexer) {
          this.mutatedType.indexer = {
            key: tail.mutatedType,
            value: this.mutatedType.indexer.value,
          };
        }
      },
      onTailDeletion: () => {
        this.mutate();
        if (this.mutatedType.indexer) {
          this.mutatedType.indexer = {
            key: this.$.builtin.integer,
            value: this.mutatedType.indexer.value,
          };
        }
      },
      onTailReplaced: (newTail) => {
        this.mutate();
        if (this.mutatedType.indexer) {
          this.mutatedType.indexer = {
            key: newTail.mutatedType,
            value: this.mutatedType.indexer.value,
          };
        }
      },
    });
  }

  connectIndexerKey(indexerNode: MutationNode<Scalar>) {
    this.startIndexerKeyEdge().setTail(indexerNode);
  }

  connectIndexerValue(indexerNode: MutationNode<Type>) {
    this.startIndexerValueEdge().setTail(indexerNode);
  }
}
