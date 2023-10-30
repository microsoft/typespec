import {
  createDiagnosticCollector,
  Diagnostic,
  DiagnosticCollector,
  getDoc,
  getErrorsDoc,
  getReturnsDoc,
  isArrayModelType,
  isErrorModel,
  isNullType,
  isVoidType,
  Model,
  ModelProperty,
  Operation,
  Program,
  Type,
  walkPropertiesInherited,
} from "@typespec/compiler";
import { getContentTypes, isContentTypeHeader } from "./content-types.js";
import {
  getHeaderFieldName,
  getStatusCodeDescription,
  getStatusCodesWithDiagnostics,
  isBody,
  isHeader,
  isStatusCode,
} from "./decorators.js";
import { createDiagnostic, reportDiagnostic } from "./lib.js";
import { gatherMetadata, isApplicableMetadata, Visibility } from "./metadata.js";
import { HttpStateKeys } from "./state.js";
import { HttpOperationResponse, HttpStatusCodes, HttpStatusCodesEntry } from "./types.js";

/**
 * Get the responses for a given operation.
 */
export function getResponsesForOperation(
  program: Program,
  operation: Operation
): [HttpOperationResponse[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const responseType = operation.returnType;
  const responses = new ResponseIndex();
  if (responseType.kind === "Union") {
    for (const option of responseType.variants.values()) {
      if (isNullType(option.type)) {
        // TODO how should we treat this? https://github.com/microsoft/typespec/issues/356
        continue;
      }
      processResponseType(program, diagnostics, operation, responses, option.type);
    }
  } else {
    processResponseType(program, diagnostics, operation, responses, responseType);
  }

  return diagnostics.wrap(responses.values());
}

/**
 * Class keeping an index of all the response by status code
 */
class ResponseIndex {
  readonly #index = new Map<string, HttpOperationResponse>();

  public get(statusCode: HttpStatusCodesEntry): HttpOperationResponse | undefined {
    return this.#index.get(this.#indexKey(statusCode));
  }

  public set(statusCode: HttpStatusCodesEntry, response: HttpOperationResponse): void {
    this.#index.set(this.#indexKey(statusCode), response);
  }

  public values(): HttpOperationResponse[] {
    return [...this.#index.values()];
  }

  #indexKey(statusCode: HttpStatusCodesEntry) {
    if (typeof statusCode === "number" || statusCode === "*") {
      return String(statusCode);
    } else {
      return `${statusCode.start}-${statusCode.end}`;
    }
  }
}

function processResponseType(
  program: Program,
  diagnostics: DiagnosticCollector,
  operation: Operation,
  responses: ResponseIndex,
  responseType: Type
) {
  const metadata = gatherMetadata(program, diagnostics, responseType, Visibility.Read);

  // Get explicity defined status codes
  const statusCodes: HttpStatusCodes = diagnostics.pipe(
    getResponseStatusCodes(program, responseType, metadata)
  );

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
      statusCodes.push(204);
    } else if (isErrorModel(program, responseType)) {
      statusCodes.push("*");
    } else {
      statusCodes.push(200);
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
    const response: HttpOperationResponse = responses.get(statusCode) ?? {
      statusCode: typeof statusCode === "object" ? "*" : (String(statusCode) as any),
      statusCodes: statusCode,
      type: responseType,
      description: getResponseDescription(program, operation, responseType, statusCode, bodyType),
      responses: [],
    };

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
    responses.set(statusCode, response);
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
): [HttpStatusCodes, readonly Diagnostic[]] {
  const codes: HttpStatusCodes = [];
  const diagnostics = createDiagnosticCollector();

  let statusFound = false;
  for (const prop of metadata) {
    if (isStatusCode(program, prop)) {
      if (statusFound) {
        reportDiagnostic(program, {
          code: "multiple-status-codes",
          target: responseType,
        });
      }
      statusFound = true;
      codes.push(...diagnostics.pipe(getStatusCodesWithDiagnostics(program, prop)));
    }
  }

  // This is only needed to retrieve the * status code set by @defaultResponse.
  // https://github.com/microsoft/typespec/issues/2485
  if (responseType.kind === "Model") {
    for (let t: Model | undefined = responseType; t; t = t.baseModel) {
      codes.push(...getExplicitSetStatusCode(program, t));
    }
  }

  return diagnostics.wrap(codes);
}

function getExplicitSetStatusCode(program: Program, entity: Model | ModelProperty): "*"[] {
  return program.stateMap(HttpStateKeys.statusCodeKey).get(entity) ?? [];
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
  if (responseType.kind !== "Model" || isArrayModelType(program, responseType)) {
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
  operation: Operation,
  responseType: Type,
  statusCode: HttpStatusCodes[number],
  bodyType: Type | undefined
): string | undefined {
  // NOTE: If the response type is an envelope and not the same as the body
  // type, then use its @doc as the response description. However, if the
  // response type is the same as the body type, then use the default status
  // code description and don't duplicate the schema description of the body
  // as the response description. This allows more freedom to change how
  // TypeSpec is expressed in semantically equivalent ways without causing
  // the output to change unnecessarily.
  if (responseType !== bodyType) {
    const desc = getDoc(program, responseType);
    if (desc) {
      return desc;
    }
  }

  const desc = isErrorModel(program, responseType)
    ? getErrorsDoc(program, operation)
    : getReturnsDoc(program, operation);
  if (desc) {
    return desc;
  }

  return getStatusCodeDescription(statusCode);
}
