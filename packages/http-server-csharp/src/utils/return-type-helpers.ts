import type { Model, Program, Type } from "@typespec/compiler";
import { isErrorModel, isVoidType } from "@typespec/compiler";

/**
 * Extracts the "success" type from a return type.
 * If the return type is a Union, returns the first non-error variant.
 * If the return type is void, returns undefined.
 */
export function getSuccessReturnType(program: Program, returnType: Type): Type | undefined {
  const visitedUnions = new Set<Type>();

  function findSuccessType(type: Type): Type | undefined {
    if (isVoidType(type)) return undefined;

    if (type.kind === "Union") {
      if (visitedUnions.has(type)) return undefined;
      visitedUnions.add(type);

      for (const variant of type.variants.values()) {
        const successType = findSuccessType(variant.type);
        if (successType !== undefined) return successType;
      }
      return undefined;
    }

    // Skip error models by checking the @error decorator or name convention
    if (type.kind === "Model") {
      try {
        if (isErrorModel(program, type)) return undefined;
      } catch {
        // isErrorModel may fail on certain types
      }
      if (type.name && type.name.toLowerCase() === "error") {
        return undefined;
      }
      // Skip response-only models (only @statusCode, no body props)
      if (isStatusCodeOnlyModel(type)) {
        return undefined;
      }
    }

    return type;
  }

  return findSuccessType(returnType);
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
function* walkPropertiesInherited(
  model: Model,
): Iterable<import("@typespec/compiler").ModelProperty> {
  for (const prop of model.properties.values()) {
    yield prop;
  }
  if (model.baseModel) {
    yield* walkPropertiesInherited(model.baseModel);
  }
}
