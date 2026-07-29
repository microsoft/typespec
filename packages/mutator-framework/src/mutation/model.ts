import type { MemberType, Model, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

export abstract class ModelMutation<
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Model, TCustomMutations, TOptions, TEngine> {
  readonly kind = "Model";
  baseModel?: MutationFor<TCustomMutations, "Model">;
  properties: Map<string, MutationFor<TCustomMutations, "ModelProperty">> = new Map();
  indexer?: {
    key: MutationFor<TCustomMutations, "Scalar">;
    value: MutationFor<TCustomMutations, Type["kind"]>;
  };

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

  mutate(newOptions: MutationOptions = this.options) {
    this.mutateBaseModel(newOptions);
    this.mutateProperties(newOptions);
    this.mutateIndexer(newOptions);
  }
}
