import {
  createDiagnosticCollector,
  Diagnostic,
  DiagnosticCollector,
  getDoc,
  getIntrinsicModelName,
  isArrayModelType,
  isErrorModel,
  isIntrinsic,
  isVoidType,
  Model,
  ModelProperty,
  Operation,
  Program,
  Type,
  walkPropertiesInherited,
} from "@cadl-lang/compiler";
import { createDiagnostic } from "../lib.js";
import { getContentTypes, isContentTypeHeader } from "./content-types.js";
import {
  getHeaderFieldName,
  getStatusCodeDescription,
  getStatusCodes,
  isBody,
  isHeader,
  isStatusCode,
} from "./decorators.js";
import { gatherMetadata, isApplicableMetadata, Visibility } from "./metadata.js";
import { HttpOperationResponse } from "./types.js";

/**
 * Get the responses for a given operation.
 */
export function getResponsesForOperation(
  program: Program,
  operation: Operation
): [HttpOperationResponse[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const responseType = operation.returnType;
  const responses: Record<string | symbol, HttpOperationResponse> = {};
  if (responseType.kind === "Union") {
    for (const option of responseType.variants.values()) {
      if (isNullType(program, option.type)) {
        // TODO how should we treat this? https://github.com/microsoft/cadl/issues/356
        continue;
      }
      processResponseType(program, diagnostics, responses, option.type);
    }
  } else {
    processResponseType(program, diagnostics, responses, responseType);
  }

  return diagnostics.wrap(Object.values(responses));
}

function isNullType(program: Program, type: Type): boolean {
  return isIntrinsic(program, type) && getIntrinsicModelName(program, type) === "null";
}

function processResponseType(
  program: Program,
  diagnostics: DiagnosticCollector,
  responses: Record<string, HttpOperationResponse>,
  responseType: Type
) {
  const metadata = gatherMetadata(program, diagnostics, responseType, Visibility.Read);

  // Get explicity defined status codes
  const statusCodes: Array<string> = getResponseStatusCodes(program, responseType, metadata);

  // Get explicitly defined content types
  const contentTypes = getResponseContentTypes(program, diagnostics, metadata);

  // Get response headers
  const headers = getResponseHeaders(program, metadata);

  // Get body
  let bodyType = getResponseBody(program, diagnostics, responseType, metadata);

  // If there is no explicit status code, check if it should be 204
  if (statusCodes.length === 0) {
    if (bodyType === undefined || isVoidType(bodyType)) {
      bodyType = undefined;
      statusCodes.push("204");
    } else if (isErrorModel(program, responseType)) {
      statusCodes.push("*");
    } else {
      statusCodes.push("200");
    }
  }

  // If there is a body but no explicit content types, use application/json
  if (bodyType && contentTypes.length === 0) {
    contentTypes.push("application/json");
  }

  // Put them into currentEndpoint.responses
  for (const statusCode of statusCodes) {
    // the first model for this statusCode/content type pair carries the
    // description for the endpoint. This could probably be improved.
    const response: HttpOperationResponse = responses[statusCode] ?? {
      statusCode,
      type: responseType,
      description: getResponseDescription(program, responseType, statusCode, bodyType),
      responses: [],
    };

    // check for duplicates
    for (const contentType of contentTypes) {
      if (response.responses.find((x) => x.body?.contentTypes.includes(contentType))) {
        diagnostics.add(
          createDiagnostic({
            code: "duplicate-response",
            format: { statusCode: statusCode.toString(), contentType },
            target: responseType,
          })
        );
      }
    }

    if (bodyType !== undefined) {
      response.responses.push({ body: { contentTypes: contentTypes, type: bodyType }, headers });
    } else if (contentTypes.length > 0) {
      diagnostics.add(
        createDiagnostic({
          code: "content-type-ignored",
          target: responseType,
        })
      );
    } else {
      response.responses.push({ headers });
    }
    responses[statusCode] = response;
  }
}

/**
 * Get explicity defined status codes from response type and metadata
 * Return is an array of strings, possibly empty, which indicates no explicitly defined status codes.
 * We do not check for duplicates here -- that will be done by the caller.
 */
function getResponseStatusCodes(
  program: Program,
  responseType: Type,
  metadata: Set<ModelProperty>
): string[] {
  const codes: string[] = [];

  for (const prop of metadata) {
    if (isStatusCode(program, prop)) {
      codes.push(...getStatusCodes(program, prop));
    }
  }

  if (responseType.kind === "Model") {
    for (let t: Model | undefined = responseType; t; t = t.baseModel) {
      codes.push(...getStatusCodes(program, t));
    }
  }

  return codes;
}

/**
 * Get explicity defined content-types from response metadata
 * Return is an array of strings, possibly empty, which indicates no explicitly defined content-type.
 * We do not check for duplicates here -- that will be done by the caller.
 */
function getResponseContentTypes(
  program: Program,
  diagnostics: DiagnosticCollector,
  metadata: Set<ModelProperty>
): string[] {
  const contentTypes: string[] = [];
  for (const prop of metadata) {
    if (isHeader(program, prop) && isContentTypeHeader(program, prop)) {
      contentTypes.push(...diagnostics.pipe(getContentTypes(prop)));
    }
  }
  return contentTypes;
}

/**
 * Get response headers from response metadata
 */
function getResponseHeaders(
  program: Program,
  metadata: Set<ModelProperty>
): Record<string, ModelProperty> {
  const responseHeaders: Record<string, ModelProperty> = {};
  for (const prop of metadata) {
    const headerName = getHeaderFieldName(program, prop);
    if (isHeader(program, prop) && headerName !== "content-type") {
      responseHeaders[headerName] = prop;
    }
  }
  return responseHeaders;
}

function getResponseBody(
  program: Program,
  diagnostics: DiagnosticCollector,
  responseType: Type,
  metadata: Set<ModelProperty>
): Type | undefined {
  // non-model or intrinsic/array model -> response body is response type
  if (
    responseType.kind !== "Model" ||
    isIntrinsic(program, responseType) ||
    isArrayModelType(program, responseType)
  ) {
    return responseType;
  }

  // look for explicit body
  let bodyProperty: ModelProperty | undefined;
  for (const property of metadata) {
    if (isBody(program, property)) {
      if (bodyProperty) {
        diagnostics.add(createDiagnostic({ code: "duplicate-body", target: property }));
      } else {
        bodyProperty = property;
      }
    }
  }
  if (bodyProperty) {
    return bodyProperty.type;
  }

  // Without an explicit body, response type is response model itself if
  // there it has at least one non-metadata property, if it is an empty object or if it has derived
  // models
  if (responseType.derivedModels.length > 0 || responseType.properties.size === 0) {
    return responseType;
  }
  for (const property of walkPropertiesInherited(responseType)) {
    if (!isApplicableMetadata(program, property, Visibility.Read)) {
      return responseType;
    }
  }

  // Otherwise, there is no body
  return undefined;
}

function getResponseDescription(
  program: Program,
  responseType: Type,
  statusCode: string,
  bodyType: Type | undefined
): string | undefined {
  // NOTE: If the response type is an envelope and not the same as the body
  // type, then use its @doc as the response description. However, if the
  // response type is the same as the body type, then use the default status
  // code description and don't duplicate the schema description of the body
  // as the response description. This allows more freedom to change how
  // Cadl is expressed in semantically equivalent ways without causing
  // the output to change unnecessarily.
  if (responseType !== bodyType) {
    const desc = getDoc(program, responseType);
    if (desc) {
      return desc;
    }
  }

  return getStatusCodeDescription(statusCode);
}
