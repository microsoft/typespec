import type {
  Diagnostic,
  DiagnosticCollector,
  Model,
  ModelProperty,
  Operation,
  Program,
  Type,
} from "@typespec/compiler";
import {
  createDiagnosticCollector,
  getDoc,
  getErrorsDoc,
  getReturnsDoc,
  isErrorModel,
  isNullType,
  isVoidType,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {
  getOperationVerb,
  getStatusCodeDescription,
  getStatusCodesWithDiagnostics,
} from "./decorators.js";
import type { HttpProperty } from "./http-property.js";
import { HttpStateKeys, reportDiagnostic } from "./lib.js";
import { Visibility } from "./metadata.js";
import { HttpPayloadDisposition, resolveHttpPayload } from "./payload.js";
import type {
  HttpOperationResponse,
  HttpOperationResponseContent,
  HttpPayloadBody,
  HttpStatusCodes,
  HttpStatusCodesEntry,
} from "./types.js";

/**
 * Get the responses for a given operation.
 */
export function getResponsesForOperation(
  program: Program,
  operation: Operation,
): [HttpOperationResponse[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  // Resolve union variants into concrete response types, grouping plain body variants
  // (no HTTP metadata) into a single union type.
  const variants = resolveResponseVariants(program, operation.returnType);
  const processedResponses: ProcessedResponseType[] = [];
  for (const { type, description } of variants) {
    processedResponses.push(
      processResponseType(program, diagnostics, operation, type, description),
    );
  }

  const responsesByStatus = new ResponseIndex();
  for (const response of processedResponses) {
    for (const statusCode of response.statusCodes) {
      responsesByStatus.add(statusCode, response);
    }
  }

  const responses: HttpOperationResponse[] = [];
  for (const [statusCode, responseGroup] of responsesByStatus.entries()) {
    const responseContents: HttpOperationResponseContent[] = responseGroup.map((response) => {
      const content: HttpOperationResponseContent = {
        headers: response.headers,
        properties: response.properties,
      };
      if (response.body) {
        content.body = response.body;
      }
      return content;
    });

    responses.push({
      statusCodes: statusCode,
      // It would be more accurate to express the response type as a union of all variant types.
      // However, downstream code written since we first decided to use only the first variant's
      // type may rely on us to continue doing so. For now, keep this behavior.
      type: responseGroup[0].type,
      description: getResponsesDescription(program, operation, statusCode, responseGroup),
      responses: responseContents,
    });
  }

  return diagnostics.wrap(responses);
}

interface ResolvedResponseVariant {
  type: Type;
  description?: string;
}

/**
 * Recursively flatten union variants and group "plain body" variants into a single union type.
 * Variants with HTTP metadata (e.g., @statusCode, @header) are kept separate.
 */
function resolveResponseVariants(
  program: Program,
  responseType: Type,
  parentDescription?: string,
): ResolvedResponseVariant[] {
  const tk = $(program);
  if (!tk.union.is(responseType) || tk.union.getDiscriminatedUnion(responseType)) {
    return [{ type: responseType, description: parentDescription }];
  }

  const unionDescription = getDoc(program, responseType) ?? parentDescription;

  // Recursively flatten all union variants, then classify.
  const plainVariants: Type[] = [];
  const responseEnvelopes: ResolvedResponseVariant[] = [];

  for (const option of responseType.variants.values()) {
    if (isNullType(option.type)) {
      continue;
    }
    // Recursively resolve nested unions
    const resolved = resolveResponseVariants(
      program,
      option.type,
      getDoc(program, option) ?? unionDescription,
    );
    for (const variant of resolved) {
      if (isPlainResponseBody(program, variant.type)) {
        plainVariants.push(variant.type);
      } else {
        responseEnvelopes.push(variant);
      }
    }
  }

  // Combine plain variants into a single union type, process envelope variants individually.
  const results: ResolvedResponseVariant[] = [];
  if (plainVariants.length === 1) {
    results.push({ type: plainVariants[0], description: unionDescription });
  } else if (plainVariants.length > 1) {
    // Reuse the original union if all variants are plain, otherwise create a new one.
    const unionType =
      responseEnvelopes.length === 0 ? responseType : tk.union.create(plainVariants);
    results.push({ type: unionType, description: unionDescription });
  }
  results.push(...responseEnvelopes);
  return results;
}

/**
 * Class keeping an index of all the response by status code
 */
class ResponseIndex {
  readonly #index = new Map<string, ProcessedResponseType[]>();

  public add(statusCode: HttpStatusCodesEntry, response: ProcessedResponseType): void {
    const indexKey = this.#indexKey(statusCode);
    if (this.#index.has(indexKey)) {
      this.#index.get(indexKey)!.push(response);
      return;
    }
    this.#index.set(indexKey, [response]);
  }

  public *entries(): MapIterator<[HttpStatusCodesEntry, ProcessedResponseType[]]> {
    for (const [indexKey, responses] of this.#index.entries()) {
      let parsedStatusCodes: HttpStatusCodesEntry;
      if (indexKey === "*") {
        parsedStatusCodes = "*";
      } else if (indexKey.includes(",")) {
        const [start, end] = indexKey.split(",");
        parsedStatusCodes = { start: Number(start), end: Number(end) };
      } else {
        parsedStatusCodes = Number(indexKey);
      }
      yield [parsedStatusCodes, responses];
    }
  }

  #indexKey(statusCode: HttpStatusCodesEntry) {
    if (typeof statusCode === "number" || statusCode === "*") {
      return String(statusCode);
    } else {
      return `${statusCode.start},${statusCode.end}`;
    }
  }
}

interface ProcessedResponseType {
  statusCodes: HttpStatusCodes;
  type: Type;
  parentDescription?: string;
  body?: HttpPayloadBody;
  headers: Record<string, ModelProperty>;
  properties: HttpProperty[];
}

function processResponseType(
  program: Program,
  diagnostics: DiagnosticCollector,
  operation: Operation,
  responseType: Type,
  parentDescription: string | undefined,
): ProcessedResponseType {
  // Get body
  const verb = getOperationVerb(program, operation);
  let { body: resolvedBody, metadata } = diagnostics.pipe(
    resolveHttpPayload(program, responseType, Visibility.Read, HttpPayloadDisposition.Response, {
      treatContentTypeAsHeader: verb === "head",
    }),
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

  return {
    statusCodes: statusCodes,
    type: responseType,
    parentDescription,
    body: resolvedBody,
    headers: headers,
    properties: metadata,
  };
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

/**
 * Check if a type is a plain body with no HTTP response envelope metadata.
 * Plain body types can be merged into a union when they share the same status code.
 */
function isPlainResponseBody(program: Program, type: Type): boolean {
  if (isVoidType(type) || isErrorModel(program, type)) {
    return false;
  }
  if (type.kind === "Model" && getExplicitSetStatusCode(program, type).length > 0) {
    return false;
  }
  const [result] = resolveHttpPayload(
    program,
    type,
    Visibility.Read,
    HttpPayloadDisposition.Response,
  );
  return !result || !result.metadata.some((p) => p.kind !== "bodyProperty");
}

function getResponsesDescription(
  program: Program,
  operation: Operation,
  statusCode: HttpStatusCodes[number],
  variants: ProcessedResponseType[],
) {
  if (variants.length <= 0) {
    return getStatusCodeDescription(statusCode);
  }

  function getSingleResponseDescription(variant: ProcessedResponseType): string | undefined {
    if (variant.parentDescription) {
      return variant.parentDescription;
    }

    // NOTE: If the response type includes response envelope metadata (e.g. @statusCode, @header),
    // then use its @doc as the response description. Plain body types intentionally fall back to
    // the status-code/operation-level descriptions to avoid duplicating the schema description as
    // the response description.
    if (isResponseEnvelope(variant.properties)) {
      const desc = getDoc(program, variant.type);
      if (desc) return desc;
    }

    return undefined;
  }

  const firstDesc = getSingleResponseDescription(variants[0]);
  if (firstDesc && variants.every((v) => getSingleResponseDescription(v) === firstDesc)) {
    return firstDesc;
  }

  let hasError = false,
    hasSuccess = false;
  for (const variant of variants) {
    if (isErrorModel(program, variant.type)) {
      hasError = true;
    } else {
      hasSuccess = true;
    }
  }

  let desc: string | undefined;
  if (hasSuccess && !hasError) {
    desc = getReturnsDoc(program, operation);
  } else if (hasError && !hasSuccess) {
    desc = getErrorsDoc(program, operation);
  }
  return desc || getStatusCodeDescription(statusCode);
}
