import { isVoidType } from "@typespec/compiler";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";

/**
 * Determines the success HTTP status code and whether the response has a body.
 * Checks the original return type for @statusCode properties.
 */
export function getSuccessStatusCode(operation: OperationHttpCanonicalization): {
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
    for (const variant of returnType.variants.values()) {
      const vt = variant.type;
      if (isVoidType(vt)) continue;
      if (vt.kind === "Model") {
        // Skip models with @error decorator or error-range status codes
        const result = analyzeResponseModel(vt);
        if (result.statusCode !== undefined && result.statusCode >= 400) continue;
        return result;
      }
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
