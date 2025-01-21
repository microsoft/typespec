import type { Model, ModelProperty, Type } from "../core/types.js";
import { unsafe_useStateMap, unsafe_useStateSet } from "../experimental/state-accessor.js";

function createStateSymbol(name: string) {
  return Symbol.for(`TypeSpec.${name}`);
}

export function useStateMap<K extends Type, V>(key: string | symbol) {
  return unsafe_useStateMap<K, V>(typeof key === "string" ? createStateSymbol(key) : key);
}

export function useStateSet<K extends Type>(key: string | symbol) {
  return unsafe_useStateSet<K>(typeof key === "string" ? createStateSymbol(key) : key);
}

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
