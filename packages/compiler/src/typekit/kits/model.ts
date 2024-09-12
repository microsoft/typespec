import { getEffectiveModelType } from "../../core/checker.js";
import type { Model, ModelProperty, SourceModel, Type } from "../../core/types.js";
import { createRekeyableMap } from "../../utils/misc.js";
import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

interface ModelDescriptor {
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
  model: {
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

    /**
     * Check if the enum is an anonyous model. Specifically, this checks if the
     * model has a name.
     *
     * @param type The model to check.
     */
    isExpresion(type: Model): boolean;

    /**
     * If the input is anonymous (or the provided filter removes properties)
     * and there exists a named model with the same set of properties
     * (ignoring filtered properties), then return that named model.
     * Otherwise, return the input unchanged.
     *
     * This can be used by emitters to find a better name for a set of
     * properties after filtering. For example, given `{ @metadata prop:
     * string} & SomeName`, and an emitter that wishes to discard properties
     * marked with `@metadata`, the emitter can use this to recover that the
     * best name for the remaining properties is `SomeName`.
     *
     * @param model The input model
     * @param filter An optional filter to apply to the input model's
     * properties.
     */
    getEffectiveModel(model: Model, filter?: (property: ModelProperty) => boolean): Model;
  };
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends ModelKit {}
}

export const ModelKit = defineKit<ModelKit>({
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

    isExpresion(type) {
      return type.name === "";
    },
    getEffectiveModel(model, filter?: (property: ModelProperty) => boolean) {
      return getEffectiveModelType(this.program, model, filter);
    },
  },
});
