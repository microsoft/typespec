import type { Model, ModelProperty, SourceModel, Type } from "../../../core/types.js";
import { createRekeyableMap } from "../../../utils/misc.js";
import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

export interface ModelDescriptor {
  /**
   * The name of the Model. If name is provided, it is a Model  declaration.
   * Otherwise, it is a Model expression.
   */
  name?: string;

  /**
   * Decorators to apply to the Model.
   */
  decorators?: DecoratorArgs[];

  /**
   * Properties of the model.
   */
  properties: Record<string, ModelProperty>;

  /**
   * Models that extend this model.
   */
  derivedModels?: Model[];

  /**
   * Models that this model extends.
   */
  sourceModels?: SourceModel[];
}

export interface ModelKit {
  /**
   * Create a model type.
   *
   * @param desc The descriptor of the model.
   */
  create(desc: ModelDescriptor): Model;

  /**
   * Check if the given `type` is a model..
   *
   * @param type The type to check.
   */
  is(type: Type): type is Model;
}

interface TypeKit {
  /**
   * Utilities for working with models.
   */
  model: ModelKit;
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends TypeKit {}
}

defineKit<TypeKit>({
  model: {
    create(desc) {
      const properties = createRekeyableMap(Array.from(Object.entries(desc.properties)));
      const model: Model = this.program.checker.createType({
        kind: "Model",
        name: desc.name ?? "",
        decorators: decoratorApplication(desc.decorators),
        properties: properties,
        expression: desc.name === undefined,
        node: undefined as any,
        derivedModels: desc.derivedModels ?? [],
        sourceModels: desc.sourceModels ?? [],
      });

      this.program.checker.finishType(model);
      return model;
    },

    is(type) {
      return type.kind === "Model";
    },
  },
});
