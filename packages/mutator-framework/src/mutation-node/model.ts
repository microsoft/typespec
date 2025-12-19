import type { Model, ModelProperty, Scalar, Type } from "@typespec/compiler";
import type { ModelPropertyMutationNode } from "./model-property.js";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";
import { traceNode } from "./tracer.js";

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
      onTailMutation: ({ tail }) => {
        this.mutate();
        this.mutatedType!.baseModel = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.mutate();
        this.mutatedType.baseModel = undefined;
      },
      onTailReplaced: ({ newTail, head, reconnect }) => {
        if (newTail.mutatedType.kind !== "Model") {
          throw new Error("Cannot replace base model with non-model type");
        }
        head.mutate();
        head.mutatedType.baseModel = newTail.mutatedType;
        if (reconnect) {
          head.connectBase(newTail as MutationNode<Model>);
        }
      },
    });
  }
  connectBase(baseNode: MutationNode<Model>) {
    this.startBaseModelEdge().setTail(baseNode);
  }

  startPropertyEdge() {
    return new HalfEdge<Model, ModelProperty>(this, {
      onTailCreation: ({ tail }) => {
        tail.connectModel(this);
      },
      onTailMutation: ({ tail }) => {
        this.mutate();
        traceNode(
          this,
          `Model property mutated: ${tail.sourceType.name} -> ${tail.mutatedType.name}`,
        );
        this.mutatedType.properties.delete(tail.sourceType.name);
        this.mutatedType.properties.set(tail.mutatedType.name, tail.mutatedType);
      },
      onTailDeletion: ({ tail }) => {
        this.mutate();
        this.mutatedType.properties.delete(tail.sourceType.name);
      },
      onTailReplaced: ({ oldTail, newTail, head, reconnect }) => {
        if (newTail.mutatedType.kind !== "ModelProperty") {
          throw new Error("Cannot replace model property with non-model property type");
        }
        head.mutate();
        traceNode(
          this,
          `Model property replaced: ${oldTail.sourceType.name} -> ${newTail.mutatedType.name}`,
        );
        head.mutatedType.properties.delete(oldTail.sourceType.name);
        head.mutatedType.properties.set(newTail.mutatedType.name, newTail.mutatedType);
        if (reconnect) {
          head.connectProperty(newTail as unknown as ModelPropertyMutationNode);
        }
      },
    });
  }

  connectProperty(propNode: ModelPropertyMutationNode) {
    this.startPropertyEdge().setTail(propNode);
  }

  startIndexerValueEdge() {
    return new HalfEdge<Model, Type>(this, {
      onTailMutation: ({ tail }) => {
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
      onTailReplaced: ({ newTail, head, reconnect }) => {
        head.mutate();
        if (head.mutatedType.indexer) {
          head.mutatedType.indexer = {
            key: head.mutatedType.indexer.key,
            value: newTail.mutatedType,
          };
        }
        if (reconnect) {
          head.connectIndexerValue(newTail);
        }
      },
    });
  }

  startIndexerKeyEdge() {
    return new HalfEdge<Model, Scalar>(this, {
      onTailMutation: ({ tail }) => {
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
      onTailReplaced: ({ newTail, head, reconnect }) => {
        if (!head.$.scalar.is(newTail.mutatedType)) {
          throw new Error("Cannot replace indexer key with non-scalar type");
        }
        head.mutate();
        if (head.mutatedType.indexer) {
          head.mutatedType.indexer = {
            key: newTail.mutatedType,
            value: head.mutatedType.indexer.value,
          };
        }
        if (reconnect) {
          head.connectIndexerKey(newTail as MutationNode<Scalar>);
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
