import { getEffectiveModelType } from "../../../core/checker.js";
import type {
  Model,
  ModelIndexer,
  ModelProperty,
  RekeyableMap,
  SourceModel,
  Type,
} from "../../../core/types.js";
import { createRekeyableMap } from "../../../utils/misc.js";
import { defineKit } from "../define-kit.js";
import { copyMap, decoratorApplication, DecoratorArgs } from "../utils.js";

/**
 * A descriptor for creating a model.
 * @experimental
 */
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
  /**
   * The indexer property of the model.
   */
  indexer?: ModelIndexer;
}

/**
 * Utilities for working with models.
 * @experimental
 */
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

  /**
   * Check this is an anonyous model. Specifically, this checks if the
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

  /**
   * Given a model, return the type that is spread
   * @returns the type that is spread or undefined if no spread
   */
  getSpreadType: (model: Model) => Type | undefined;
  /**
   * Gets all properties from a model, explicitly defined and implicitly defined.
   * @param model model to get the properties from
   */
  getProperties(
    model: Model,
    options?: { includeExtended?: boolean },
  ): RekeyableMap<string, ModelProperty>;
  /**
   * Get the record representing additional properties, if there are additional properties.
   * This method checks for additional properties in the following cases:
   * 1. If the model is a Record type.
   * 2. If the model extends a Record type.
   * 3. If the model spreads a Record type.
   *
   * @param model The model to get the additional properties type of.
   * @returns The record representing additional properties, or undefined if there are none.
   */
  getAdditionalPropertiesRecord(model: Model): Model | undefined;
}

interface TypekitExtension {
  /**
   * Utilities for working with models.
   * @experimental
   */
  model: ModelKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

const spreadCache = new Map<Model, Model>();
defineKit<TypekitExtension>({
  model: {
    create(desc) {
      const properties = createRekeyableMap(Array.from(Object.entries(desc.properties)));
      const model: Model = this.program.checker.createType({
        kind: "Model",
        name: desc.name ?? "",
        decorators: decoratorApplication(this, desc.decorators),
        properties: properties,
        node: undefined as any,
        derivedModels: desc.derivedModels ?? [],
        sourceModels: desc.sourceModels ?? [],
        indexer: desc.indexer,
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
    getSpreadType(model) {
      if (spreadCache.has(model)) {
        return spreadCache.get(model);
      }

      if (!model.indexer) {
        return undefined;
      }

      if (model.indexer.key.name === "string") {
        const record = this.record.create(model.indexer.value);
        spreadCache.set(model, record);
        return record;
      }

      if (model.indexer.key.name === "integer") {
        const array = this.array.create(model.indexer.value);
        spreadCache.set(model, array);
        return array;
      }

      return model.indexer.value;
    },
    getProperties(model, options = {}) {
      // Add explicitly defined properties
      const properties = copyMap(model.properties);

      // Add discriminator property if it exists
      const discriminator = this.type.getDiscriminator(model);
      if (discriminator) {
        const discriminatorName = discriminator.propertyName;
        properties.set(
          discriminatorName,
          this.modelProperty.create({ name: discriminatorName, type: this.builtin.string }),
        );
      }

      if (options.includeExtended) {
        let base = model.baseModel;
        while (base) {
          for (const [key, value] of base.properties) {
            if (!properties.has(key)) {
              properties.set(key, value);
            }
          }
          base = base.baseModel;
        }
      }
      // TODO: Add Spread?
      return properties;
    },
    getAdditionalPropertiesRecord(model) {
      // model MyModel is Record<> {} should be model with additional properties
      if (this.model.is(model) && model.sourceModel && this.record.is(model.sourceModel)) {
        return model.sourceModel;
      }

      // model MyModel extends Record<> {} should be model with additional properties
      if (model.baseModel && this.record.is(model.baseModel)) {
        return model.baseModel;
      }

      // model MyModel { ...Record<>} should be model with additional properties
      const spread = this.model.getSpreadType(model);
      if (spread && this.model.is(spread) && this.record.is(spread)) {
        return spread;
      }

      if (model.baseModel) {
        return this.model.getAdditionalPropertiesRecord(model.baseModel);
      }

      return undefined;
    },
  },
});
