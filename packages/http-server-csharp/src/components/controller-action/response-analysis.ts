import { isErrorModel, isVoidType, type Program, type Type } from "@typespec/compiler";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";

/**
 * Determines the success HTTP status code and whether the response has a body.
 * Checks the original return type for @statusCode properties.
 */
export function getSuccessStatusCode(
  program: Program,
  operation: OperationHttpCanonicalization,
): {
  statusCode: number | undefined;
  hasBody: boolean;
} {
  const returnType = operation.sourceType.returnType;

  // Check direct model response
  if (returnType.kind === "Model") {
    return analyzeResponseModel(returnType);
  }

  // Check union responses - find the first non-error success response
  if (returnType.kind === "Union") {
    let hasVoidSuccess = false;
    let hasValueSuccess = false;
    const visitedUnions = new Set<Type>();

    function analyzeVariant(
      type: Type,
    ): { statusCode: number | undefined; hasBody: boolean } | undefined {
      if (isVoidType(type)) {
        hasVoidSuccess = true;
        return undefined;
      }

      if (type.kind === "Union") {
        if (visitedUnions.has(type)) return undefined;
        visitedUnions.add(type);

        for (const variant of type.variants.values()) {
          const result = analyzeVariant(variant.type);
          if (result !== undefined) return result;
        }
        return undefined;
      }

      if (type.kind === "Model") {
        // Skip models with @error decorator or error-range status codes
        if (isErrorModel(program, type)) return undefined;
        const result = analyzeResponseModel(type);
        if (result.statusCode !== undefined && result.statusCode >= 400) return undefined;
        return result;
      }

      hasValueSuccess = true;
      return undefined;
    }

    const result = analyzeVariant(returnType);
    if (result !== undefined) {
      return result;
    }
    if (hasValueSuccess) {
      return { statusCode: 200, hasBody: true };
    }
    if (hasVoidSuccess) {
      return { statusCode: 204, hasBody: false };
    }
  }

  const hasReturnValue = !isVoidType(returnType);
  return { statusCode: hasReturnValue ? 200 : 204, hasBody: hasReturnValue };
}

function analyzeResponseModel(model: import("@typespec/compiler").Model): {
  statusCode: number | undefined;
  hasBody: boolean;
} {
  let statusCode: number | undefined;
  let bodyProps = 0;

  for (const prop of model.properties.values()) {
    // Check for @statusCode property
    if (prop.name === "statusCode") {
      // The type might be a literal number
      if (prop.type.kind === "Number") {
        statusCode = prop.type.value;
      }
      continue;
    }
    bodyProps++;
  }

  // Model with only @statusCode and no body props → no body
  // But if the model has an indexer (Record<T>), it IS a body
  if (bodyProps === 0 && !model.indexer) {
    return { statusCode: statusCode ?? 204, hasBody: false };
  }

  return { statusCode, hasBody: true };
}
