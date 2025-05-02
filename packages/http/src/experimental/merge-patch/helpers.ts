import { isArrayModelType, Model, ModelProperty, Program, Type, Value } from "@typespec/compiler";
import { HttpStateKeys } from "../../lib.js";

/**
 * Determines if the given model is part of a mergePatch transform
 * @param program The compiled TypeSpec program
 * @param model The model to check
 * @returns true if the model was generated using a mergePatch template, otherwise false
 */
export function isMergePatch(program: Program, model: Model): boolean {
  return program.stateMap(HttpStateKeys.mergePatchModel).has(model);
}

/**
 * If the given model is part of a mergePatch transform, return s alink to the source model
 * @param program The compiled TypeSpec program
 * @param model The model to check
 * @returns If this model was created by a mergePatch transform, returns the corresponding model that was transformed. Otherwise returns undefined.
 */
export function getMergePatchSource(program: Program, model: Model): Model | undefined {
  return program.stateMap(HttpStateKeys.mergePatchModel).get(model);
}

/**
 * If the given property was created as part of a mergePatch transform, return s alink to the source model
 * @param program The compiled TypeSpec program
 * @param property The property to check
 * @returns If this property was created by a mergePatch transform, returns the corresponding source property that was transformed. Otherwise returns undefined.
 */
export function getMergePatchPropertySource(
  program: Program,
  property: ModelProperty,
): ModelProperty | undefined {
  return program.stateMap(HttpStateKeys.mergePatchProperty).get(property);
}

/** The characteristics of the property as part of a mergePatch request body */
export interface MergePatchProperties {
  /** Can the property accept null */
  erasable: boolean;
  /** How does the property update the corresponding resource property */
  updateBehavior: "merge" | "replace";
  /** If this property is null, what will the corresponding value of the resource be set to (undefined if the resource property has no default) */
  erasedValue?: Value;
  /** The sourceProperty of this property */
  sourceProperty?: ModelProperty;
}

/**
 * Returns the MergePatch characteristics of the property, if the property is used in a MergePatch request
 * @param program The compiled TypeSpec program
 * @param property The model property to check
 * @returns The characteristics of the property in a MergePatch request (or undefined if the property is not part of a mErgePatch request)
 */
export function getMergePatchProperties(
  program: Program,
  property: ModelProperty,
): MergePatchProperties | undefined {
  function getUpdateBehavior(type: Type): "merge" | "replace" {
    switch (type.kind) {
      case "Model":
        if (isArrayModelType(program, type)) return "merge";
        return "replace";
      default:
        return "replace";
    }
  }
  if (!property.model || !isMergePatch(program, property.model)) return undefined;
  const sourceProperty = getMergePatchPropertySource(program, property)!;
  return {
    erasable: sourceProperty.optional || sourceProperty.defaultValue !== undefined,
    updateBehavior: getUpdateBehavior(sourceProperty.type),
    sourceProperty: sourceProperty,
    erasedValue: sourceProperty.defaultValue,
  };
}
