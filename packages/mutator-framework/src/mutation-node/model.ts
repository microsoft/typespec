import type { Model, ModelProperty, Scalar, Type } from "@typespec/compiler";
import type { ModelPropertyMutationNode } from "./model-property.js";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";
import { traceNode } from "./tracer.js";

/** Connection-key configuration shape; current node connection methods do not consume it. */
export interface ModelConnectOptions {
  /** Key designated for a base model node; callers must select that node explicitly. */
  baseModel?: string;
  /** Key designated for an indexer value node; callers must select that node explicitly. */
  indexerValue?: string;
}

/**
 * Updates model references as connected base, property, and indexer nodes change.
 * Connections are explicit: construction alone does not traverse the model.
 */
export class ModelMutationNode extends MutationNode<Model> {
  /** Selects model-specific connection behavior, even if this node is later replaced. */
  readonly kind = "Model";
  /**
   * Starts a base reference that follows model mutations, clears the base on
   * deletion, and rejects replacements that are not models.
   */
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
  /** Completes {@link startBaseModelEdge} with the chosen base model node. */
  connectBase(baseNode: MutationNode<Model>) {
    this.startBaseModelEdge().setTail(baseNode);
  }

  /**
   * Starts a property reference and connects the property's containing-model
   * back-reference. Renames replace the source-name entry in the output map;
   * deletion removes it. Replacements must remain model properties.
   */
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

  /** Connects a property and its containing-model back-reference via {@link startPropertyEdge}. */
  connectProperty(propNode: ModelPropertyMutationNode) {
    this.startPropertyEdge().setTail(propNode);
  }

  /**
   * Starts a reference to an existing indexer's value type.
   * Deletion substitutes `any`; no indexer is created if the output has none.
   */
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

  /**
   * Starts a reference to an existing indexer's key scalar.
   * Deletion substitutes `integer`; replacements must be scalars. No indexer is
   * created if the output has none.
   */
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

  /** Completes {@link startIndexerKeyEdge} with an explicitly selected key node. */
  connectIndexerKey(indexerNode: MutationNode<Scalar>) {
    this.startIndexerKeyEdge().setTail(indexerNode);
  }

  /** Completes {@link startIndexerValueEdge} with an explicitly selected value node. */
  connectIndexerValue(indexerNode: MutationNode<Type>) {
    this.startIndexerValueEdge().setTail(indexerNode);
  }
}
