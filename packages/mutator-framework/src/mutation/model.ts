import type { MemberType, Model, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export class ModelMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
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
    referenceTypes: MemberType[] = [],
    options: TOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
  }

  protected mutateBaseModel() {
    if (this.sourceType.baseModel) {
      this.baseModel = this.engine.mutate(this.sourceType.baseModel, this.options);
    }
  }

  protected mutateProperties() {
    for (const prop of this.sourceType.properties.values()) {
      this.properties.set(prop.name, this.engine.mutate(prop, this.options));
    }
  }

  protected mutateIndexer() {
    if (this.sourceType.indexer) {
      this.indexer = {
        key: this.engine.mutate(this.sourceType.indexer.key, this.options),
        value: this.engine.mutate(this.sourceType.indexer.value, this.options),
      };
    }
  }

  mutate() {
    this.mutateBaseModel();
    this.mutateProperties();
    this.mutateIndexer();
  }
}
