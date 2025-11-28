import {
  createDiagnosticCollector,
  Diagnostic,
  DiagnosticCollector,
  getDoc,
  getErrorsDoc,
  getReturnsDoc,
  isErrorModel,
  isNullType,
  isVoidType,
  Model,
  ModelProperty,
  Operation,
  Program,
  Type,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getStatusCodeDescription, getStatusCodesWithDiagnostics } from "./decorators.js";
import { HttpProperty } from "./http-property.js";
import { HttpStateKeys, reportDiagnostic } from "./lib.js";
import { Visibility } from "./metadata.js";
import { HttpPayloadDisposition, resolveHttpPayload } from "./payload.js";
import { HttpOperationResponse, HttpStatusCodes, HttpStatusCodesEntry } from "./types.js";

/**
 * Get the responses for a given operation.
 */
export function getResponsesForOperation(
  program: Program,
  operation: Operation,
): [HttpOperationResponse[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const responseType = operation.returnType;
  const responses = new ResponseIndex();
  const tk = $(program);
  if (tk.union.is(responseType) && !tk.union.getDiscriminatedUnion(responseType)) {
    // Check if the union itself has a @doc to use as the response description
    const unionDescription = getDoc(program, responseType);
    for (const option of responseType.variants.values()) {
      if (isNullType(option.type)) {
        // TODO how should we treat this? https://github.com/microsoft/typespec/issues/356
        continue;
      }
      processResponseType(
        program,
        diagnostics,
        operation,
        responses,
        option.type,
        unionDescription,
      );
    }
  } else {
    processResponseType(program, diagnostics, operation, responses, responseType, undefined);
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
  responseType: Type,
  parentDescription?: string,
) {
  const tk = $(program);

  // If the response type is itself a union (and not discriminated), expand it recursively.
  // This handles cases where a named union is used as a return type (e.g., `op read(): MyUnion`)
  // or when unions are nested (e.g., a union variant is itself a union).
  // Each variant will be processed separately to extract its status codes and responses.
  if (tk.union.is(responseType) && !tk.union.getDiscriminatedUnion(responseType)) {
    // Check if this nested union has its own @doc, otherwise inherit parent's description
    const unionDescription = getDoc(program, responseType) ?? parentDescription;
    for (const option of responseType.variants.values()) {
      if (isNullType(option.type)) {
        continue;
      }
      processResponseType(
        program,
        diagnostics,
        operation,
        responses,
        option.type,
        unionDescription,
      );
    }
    return;
  }

  // Get body
  let { body: resolvedBody, metadata } = diagnostics.pipe(
    resolveHttpPayload(program, responseType, Visibility.Read, HttpPayloadDisposition.Response),
  );
  // Get explicity defined status codes
  const statusCodes: HttpStatusCodes = diagnostics.pipe(
    getResponseStatusCodes(program, responseType, metadata),
  );

  // Get response headers
  const headers = getResponseHeaders(program, metadata);

  // If there is no explicit status code, check if it should be 204
  if (statusCodes.length === 0) {
    if (isErrorModel(program, responseType)) {
      statusCodes.push("*");
    } else if (isVoidType(responseType)) {
      resolvedBody = undefined;
      statusCodes.push(204); // Only special case for 204 is op test(): void;
    } else if (resolvedBody === undefined || isVoidType(resolvedBody.type)) {
      resolvedBody = undefined;
      statusCodes.push(200);
    } else {
      statusCodes.push(200);
    }
  }

  // Put them into currentEndpoint.responses
  for (const statusCode of statusCodes) {
    // the first model for this statusCode/content type pair carries the
    // description for the endpoint. This could probably be improved.
    const response: HttpOperationResponse = responses.get(statusCode) ?? {
      statusCodes: statusCode,
      type: responseType,
      description: getResponseDescription(
        program,
        operation,
        responseType,
        statusCode,
        metadata,
        parentDescription,
      ),
      responses: [],
    };

    if (resolvedBody !== undefined) {
      response.responses.push({
        body: resolvedBody,
        headers,
        properties: metadata,
      });
    } else {
      response.responses.push({ headers, properties: metadata });
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
  metadata: HttpProperty[],
): [HttpStatusCodes, readonly Diagnostic[]] {
  const codes: HttpStatusCodes = [];
  const diagnostics = createDiagnosticCollector();

  let statusFound = false;
  for (const prop of metadata) {
    if (prop.kind === "statusCode") {
      if (statusFound) {
        reportDiagnostic(program, {
          code: "multiple-status-codes",
          target: responseType,
        });
      }
      statusFound = true;
      codes.push(...diagnostics.pipe(getStatusCodesWithDiagnostics(program, prop.property)));
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
  return program.stateMap(HttpStateKeys.statusCode).get(entity) ?? [];
}

/**
 * Get response headers from response metadata
 */
function getResponseHeaders(
  program: Program,
  metadata: HttpProperty[],
): Record<string, ModelProperty> {
  const responseHeaders: Record<string, ModelProperty> = {};
  for (const prop of metadata) {
    if (prop.kind === "header") {
      responseHeaders[prop.options.name] = prop.property;
    }
  }
  return responseHeaders;
}

function isResponseEnvelope(metadata: HttpProperty[]): boolean {
  return metadata.some(
    (prop) =>
      prop.kind === "body" ||
      prop.kind === "bodyRoot" ||
      prop.kind === "multipartBody" ||
      prop.kind === "statusCode",
  );
}

function getResponseDescription(
  program: Program,
  operation: Operation,
  responseType: Type,
  statusCode: HttpStatusCodes[number],
  metadata: HttpProperty[],
  parentDescription?: string,
): string | undefined {
  // If a parent union provided a description, use that first
  if (parentDescription) {
    return parentDescription;
  }

  // NOTE: If the response type is an envelope and not the same as the body
  // type, then use its @doc as the response description. However, if the
  // response type is the same as the body type, then use the default status
  // code description and don't duplicate the schema description of the body
  // as the response description. This allows more freedom to change how
  // TypeSpec is expressed in semantically equivalent ways without causing
  // the output to change unnecessarily.
  if (isResponseEnvelope(metadata)) {
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
