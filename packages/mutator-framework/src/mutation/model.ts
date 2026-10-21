import type { MemberType, Model, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/**
 * Traverses a source model's base, own properties, and indexer in that order.
 * Subclasses provide half-edges to connect the resulting strategies to their
 * output graph. Traversal reads the source, not a node's possibly modified output.
 */
export abstract class ModelMutation<
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Model, TCustomMutations, TOptions, TEngine> {
  /** Strategy discriminator; replacing output nodes does not change this value. */
  readonly kind = "Model";
  /** Base model strategy after traversal, or absent if the source has no base. */
  baseModel?: MutationFor<TCustomMutations, "Model">;
  /** Own property strategies in source order, keyed by original property names. */
  properties: Map<string, MutationFor<TCustomMutations, "ModelProperty">> = new Map();
  /** Strategies for the source indexer, absent when the source has no indexer. */
  indexer?: {
    /** Scalar strategy for the indexer's key domain. */
    key: MutationFor<TCustomMutations, "Scalar">;
    /** Strategy for the type of values stored by the indexer. */
    value: MutationFor<TCustomMutations, Type["kind"]>;
  };

  /** Initializes model traversal with the source and the engine's selected metadata. */
  constructor(
    engine: TEngine,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  protected mutateBaseModel(newOptions: MutationOptions = this.options) {
    if (this.sourceType.baseModel) {
      this.baseModel = this.engine.mutate(
        this.sourceType.baseModel,
        newOptions,
        this.startBaseEdge(),
      );
    }
  }

  protected mutateProperties(newOptions: MutationOptions = this.options) {
    for (const prop of this.sourceType.properties.values()) {
      this.properties.set(
        prop.name,
        this.engine.mutate(prop, newOptions, this.startPropertyEdge()),
      );
    }
  }

  protected mutateIndexer(newOptions: MutationOptions = this.options) {
    if (this.sourceType.indexer) {
      this.indexer = {
        key: this.engine.mutate(
          this.sourceType.indexer.key,
          newOptions,
          this.startIndexerKeyEdge(),
        ),
        value: this.engine.mutate(
          this.sourceType.indexer.value,
          newOptions,
          this.startIndexerValueEdge(),
        ),
      };
    }
  }

  protected abstract startBaseEdge(): MutationHalfEdge;
  protected abstract startPropertyEdge(): MutationHalfEdge;
  protected abstract startIndexerValueEdge(): MutationHalfEdge;
  protected abstract startIndexerKeyEdge(): MutationHalfEdge;

  /**
   * Resolves the base, properties, and indexer using the supplied options.
   * Call from an override to retain default traversal after custom node changes.
   */
  mutate(newOptions: MutationOptions = this.options) {
    this.mutateBaseModel(newOptions);
    this.mutateProperties(newOptions);
    this.mutateIndexer(newOptions);
  }
}
