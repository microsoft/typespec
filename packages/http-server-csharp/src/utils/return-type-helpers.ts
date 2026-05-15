import type { Model, Program, Type } from "@typespec/compiler";
import { isErrorModel, isVoidType } from "@typespec/compiler";

/**
 * Extracts the "success" type from a return type.
 * If the return type is a Union, returns the first non-error variant.
 * If the return type is void, returns undefined.
 */
export function getSuccessReturnType(program: Program, returnType: Type): Type | undefined {
  if (isVoidType(returnType)) return undefined;

  if (returnType.kind === "Union") {
    for (const variant of returnType.variants.values()) {
      const variantType = variant.type;
      if (isVoidType(variantType)) continue;
      // Skip error models by checking the @error decorator or name convention
      if (variantType.kind === "Model") {
        try {
          if (isErrorModel(program, variantType)) continue;
        } catch {
          // isErrorModel may fail on certain types
        }
        if (variantType.name && variantType.name.toLowerCase() === "error") {
          continue;
        }
        // Skip response-only models (only @statusCode, no body props)
        if (isStatusCodeOnlyModel(variantType)) continue;
      }
      return variantType;
    }
    // All variants are errors or void
    return undefined;
  }

  // Check if it's a status-code-only model (e.g., OkResponse, NoContentResponse)
  if (returnType.kind === "Model" && isStatusCodeOnlyModel(returnType)) {
    return undefined;
  }

  return returnType;
}

/** Returns true if the model only has statusCode-related properties (no body). Walks inherited properties too. */
function isStatusCodeOnlyModel(model: Model): boolean {
  let count = 0;
  for (const prop of walkPropertiesInherited(model)) {
    if (prop.name !== "statusCode") return false;
    count++;
  }
  return count > 0;
}

/** Yields all properties from a model and its base models. */
function* walkPropertiesInherited(model: Model): Iterable<import("@typespec/compiler").ModelProperty> {
  for (const prop of model.properties.values()) {
    yield prop;
  }
  if (model.baseModel) {
    yield* walkPropertiesInherited(model.baseModel);
  }
}
