import type { Model, ModelProperty, Program, Type, Value } from "@typespec/compiler";
import { isArrayModelType } from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import { HttpStateKeys } from "../../lib.js";

/** Per-source-property overrides consulted while constructing merge-patch models. */
export interface MergePatchPropertyOverrides {
  /** Overrides generated optionality in merge mode; absent values use the transform's discriminator-aware default. */
  optional?: boolean;
  /** When false, suppresses null erasure for optional or defaulted source properties; true does not force erasure on other properties. */
  erasable?: boolean;
  /** Recorded merge-versus-replace hint; the current transform does not consult this override. */
  updateBehavior?: "merge" | "replace";
}
/**
 * Reads or replaces a transformed model's source-model association in program state.
 * The getter returns `undefined` for an unregistered model; the setter stores the model reference without cloning.
 */
export const [getMergePatchSource, setMergePatchSource] = useStateMap<Model, Model>(
  HttpStateKeys.mergePatchModel,
);

/**
 * Reads or replaces a transformed property's source-property association.
 * The getter returns `undefined` when unregistered; the setter stores the property reference without cloning.
 */
export const [getMergePatchPropertySource, setMergePatchPropertySource] = useStateMap<
  ModelProperty,
  ModelProperty
>(HttpStateKeys.mergePatchProperty);

/**
 * Reads or replaces override settings for a source property during merge-patch transformation.
 * The getter returns `undefined` when unset. The setter replaces the stored object rather than merging or cloning it.
 */
export const [getMergePatchPropertyOverrides, setMergePatchPropertyOverrides] = useStateMap<
  ModelProperty,
  MergePatchPropertyOverrides
>(HttpStateKeys.mergePatchPropertyOptions);

/**
 * Determines if the given model is part of a mergePatch transform
 * @param program The compiled TypeSpec program
 * @param model The model to check
 * @returns true if the model was generated using a mergePatch template, otherwise false
 */
export function isMergePatch(program: Program, model: Model): boolean {
  return getMergePatchSource(program, model) !== undefined;
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
        if (isArrayModelType(type)) return "merge";
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
