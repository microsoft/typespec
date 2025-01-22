import type { Model, ModelProperty } from "../core/types.js";

/**
 * Filters the properties of a model by removing them from the model instance if
 * a given `filter` predicate is not satisfied.
 *
 * @param model - the model to filter properties on
 * @param filter - the predicate to filter properties with
 */
export function filterModelPropertiesInPlace(
  model: Model,
  filter: (prop: ModelProperty) => boolean,
) {
  for (const [key, prop] of model.properties) {
    if (!filter(prop)) {
      model.properties.delete(key);
    }
  }
}
