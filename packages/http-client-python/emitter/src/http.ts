import { getNamespaceFullName, NoTarget } from "@typespec/compiler";

import type {
  SdkBasicServiceMethod,
  SdkBodyParameter,
  SdkClientType,
  SdkHeaderParameter,
  SdkHttpErrorResponse,
  SdkHttpOperation,
  SdkHttpOperationExample,
  SdkHttpResponse,
  SdkLroPagingServiceMethod,
  SdkLroServiceMethod,
  SdkMethodParameter,
  SdkModelPropertyType,
  SdkPagingServiceMethod,
  SdkPathParameter,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkServiceResponseHeader,
  SdkSseEventMetadata,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";
import { getHttpOperationParameter, UsageFlags } from "@azure-tools/typespec-client-generator-core";
import type { HttpStatusCodeRange } from "@typespec/http";
import type { PythonSdkContext } from "./lib.js";
import { reportDiagnostic } from "./lib.js";
import { getType, KnownTypes } from "./types.js";
import {
  emitParamBase,
  getAddedOn,
  getClientName,
  getDelimiterAndExplode,
  getImplementation,
  isAbstract,
  isAzureCoreErrorResponse,
  isContinuationToken,
} from "./utils.js";

export enum ReferredByOperationTypes {
  Default = 0,
  PagingOnly = 1,
  NonPagingOnly = 2,
}

type StructuredStreamKind = "jsonl" | "sse";
type EmittedType = ReturnType<typeof getType>;

interface StructuredStreamEvent {
  eventType: string | undefined;
  /**
   * Payload type for this one SSE event. For an event envelope, this is the type of the property
   * marked `@Events.data`. Together with {@link eventType} these form the
   * runtime dispatch table (wire event name -> model to deserialize) inside the generated
   * `_callback`. This is a narrower type than {@link StructuredStreamingInfo.itemType}.
   */
  payloadType: EmittedType;
  /**
   * True when this event is a `@terminalEvent` that carries a payload (a named / model event,
   * not a bare string-constant sentinel). Such events are deserialized and yielded like any
   * other event, and iteration stops immediately after one is yielded. Contrast with
   * {@link StructuredStreamingInfo.terminalEvent}, the sentinel that stops without yielding.
   */
  isTerminal?: boolean;
  /** Content type of the payload, not the enclosing event. */
  payloadContentType?: string;
}

interface StructuredStreamingInfo {
  kind: StructuredStreamKind;
  /**
   * The aggregate stream element type used for the `Stream[T]` / `AsyncStream[T]` return
   * annotation (a single type expression). For homogeneous JSONL this is the one model; for
   * heterogeneous SSE this is the union of every event payload.
   *
   * Note the deliberate overlap with the per-event {@link StructuredStreamEvent.payloadType}: for
   * heterogeneous SSE this union is exactly the sum of the `events[]` payload types. Both are
   * carried because the union alone cannot recover the wire-name -> member mapping needed for
   * dispatch, and the events list alone is not a single valid type expression for the annotation.
   */
  itemType: EmittedType;
  events?: StructuredStreamEvent[];
  /**
   * A bare string-constant `@terminalEvent` with no event name (e.g. `"[DONE]"`). Iteration
   * stops when an event's `data` equals this value, and the sentinel is NOT yielded. Named /
   * model terminal events are carried in {@link events} with `isTerminal: true` instead.
   */
  terminalEvent?: string;
}

/** Whether pygen can deserialize the stream item type. */
export function isStructuredStreamType(type: SdkType): boolean {
  switch (type.kind) {
    case "model":
    case "union":
      return true;
    case "nullable":
      return isStructuredStreamType(type.type);
    default:
      return false;
  }
}

export function getStructuredStreamKind(
  response: SdkHttpResponse | SdkHttpErrorResponse,
): StructuredStreamKind | undefined {
  if (response.sseMetadata) return "sse";

  const contentTypes = response.streamMetadata?.contentTypes ?? response.contentTypes ?? [];
  for (const contentType of contentTypes) {
    const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
    if (mediaType === "text/event-stream") return "sse";
    if (mediaType === "application/jsonl") return "jsonl";
  }
  return undefined;
}

function getStringConstantValue(type: SdkType): string | undefined {
  if (type.kind === "nullable") return getStringConstantValue(type.type);
  return type.kind === "constant" && typeof type.value === "string" ? type.value : undefined;
}

/**
 * Split the SSE events into the runtime dispatch table and a bare string-constant sentinel.
 *
 * A `@terminalEvent` comes in two shapes:
 *   * a nameless string constant (e.g. `"[DONE]"`) -> a pure sentinel: iteration stops when an
 *     event's `data` equals this value and the event is NOT yielded. Returned as `terminalEvent`.
 *   * a named / model event (e.g. `error`, `response.completed`) -> carries a payload the consumer
 *     needs, so it is deserialized and yielded like any other event, then iteration stops. Returned
 *     in `events` with `isTerminal: true`.
 *
 * `toPayloadType` maps event payloads to emitted types; it is injected so this partitioning stays
 * a pure function that can be unit-tested without a full emitter context.
 */
export function partitionSSEEvents(
  events: readonly SdkSseEventMetadata[],
  toPayloadType: (type: SdkType) => EmittedType,
): { events: StructuredStreamEvent[]; terminalEvent?: string } {
  const dispatch: StructuredStreamEvent[] = [];
  let terminalEvent: string | undefined;
  for (const event of events) {
    if (event.isTerminalEvent) {
      const sentinelValue =
        event.eventType === undefined
          ? (getStringConstantValue(event.payloadType) ?? getStringConstantValue(event.type))
          : undefined;
      if (sentinelValue !== undefined) {
        // Keep the first sentinel; no current spec defines more than one.
        terminalEvent ??= sentinelValue;
        continue;
      }
      dispatch.push({
        eventType: event.eventType,
        payloadType: toPayloadType(event.payloadType),
        isTerminal: true,
        payloadContentType: event.payloadContentType,
      });
      continue;
    }
    dispatch.push({
      eventType: event.eventType,
      payloadType: toPayloadType(event.payloadType),
      payloadContentType: event.payloadContentType,
    });
  }
  return terminalEvent !== undefined ? { events: dispatch, terminalEvent } : { events: dispatch };
}

function emitStructuredStreamingInfo(
  context: PythonSdkContext,
  response: SdkHttpResponse | SdkHttpErrorResponse,
): StructuredStreamingInfo | undefined {
  const streamMetadata = response.streamMetadata;
  if (!streamMetadata || !isStructuredStreamType(streamMetadata.streamType)) return undefined;

  const kind = getStructuredStreamKind(response);
  if (!kind) return undefined;

  const streaming: StructuredStreamingInfo = {
    kind,
    itemType: getType(context, streamMetadata.streamType),
  };

  const sseMetadata = response.sseMetadata;
  if (!sseMetadata) return streaming;

  const { events, terminalEvent } = partitionSSEEvents(sseMetadata.events, (type) =>
    getType(context, type),
  );
  if (events.length > 0) streaming.events = events;
  if (terminalEvent !== undefined) streaming.terminalEvent = terminalEvent;

  return streaming;
}

function isEtagType(type: SdkType): boolean {
  if (type.kind === "nullable") return isEtagType(type.type);
  const raw = type.__raw;
  if (!raw || raw.kind !== "Scalar") return false;
  return (
    raw.name === "eTag" &&
    raw.namespace !== undefined &&
    getNamespaceFullName(raw.namespace) === "Azure.Core"
  );
}

function getEtagRole(parameter: SdkHeaderParameter): string | undefined {
  const name = parameter.name.toLowerCase();
  const wire = parameter.serializedName.toLowerCase();
  // Standard If-Match / If-None-Match headers work with any type
  if (wire === "if-match") return "ifMatch";
  if (wire === "if-none-match") return "ifNoneMatch";
  // Non-standard headers require Azure.Core.eTag type
  if (!isEtagType(parameter.type)) return undefined;
  if (name.includes("nonematch") || name.includes("none_match")) return "ifNoneMatch";
  if (name.includes("match")) return "ifMatch";
  if (wire.endsWith("-if-none-match")) return "ifNoneMatch";
  if (wire.endsWith("-if-match")) return "ifMatch";
  return undefined;
}

function isContentTypeParameter(parameter: SdkHeaderParameter) {
  return parameter.serializedName.toLowerCase() === "content-type";
}

function arrayToRecord(examples: SdkHttpOperationExample[] | undefined): Record<string, any> {
  const result: Record<string, any> = {};
  if (examples) {
    for (const [index, example] of examples.entries()) {
      result[index] = { ...example.rawExample, "x-ms-original-file": example.filePath };
    }
  }
  return result;
}

export function emitBasicHttpMethod(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  method: SdkBasicServiceMethod<SdkHttpOperation>,
  operationGroupName: string,
  serviceApiVersions: string[],
): Record<string, any>[] {
  return [
    {
      ...emitHttpOperation(
        context,
        rootClient,
        operationGroupName,
        method.operation,
        method,
        serviceApiVersions,
      ),
      abstract: isAbstract(method),
      name: getClientName(method),
      description: method.doc ?? "",
      summary: method.summary,
    },
  ];
}

function emitInitialLroHttpMethod(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  method: SdkLroServiceMethod<SdkHttpOperation> | SdkLroPagingServiceMethod<SdkHttpOperation>,
  operationGroupName: string,
  serviceApiVersions: string[],
): Record<string, any> {
  return {
    ...emitHttpOperation(
      context,
      rootClient,
      operationGroupName,
      method.operation,
      method,
      serviceApiVersions,
    ),
    name: `_${getClientName(method)}_initial`,
    isLroInitialOperation: true,
    wantTracing: false,
    exposeStreamKeyword: false,
    description: method.doc ?? "",
    summary: method.summary,
  };
}

function addLroInformation(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  method: SdkLroServiceMethod<SdkHttpOperation> | SdkLroPagingServiceMethod<SdkHttpOperation>,
  operationGroupName: string,
  serviceApiVersions: string[],
) {
  return {
    ...emitHttpOperation(
      context,
      rootClient,
      operationGroupName,
      method.operation,
      method,
      serviceApiVersions,
    ),
    name: getClientName(method),
    discriminator: "lro",
    initialOperation: emitInitialLroHttpMethod(
      context,
      rootClient,
      method,
      operationGroupName,
      serviceApiVersions,
    ),
    exposeStreamKeyword: false,
    description: method.doc ?? "",
    summary: method.summary,
  };
}

function getWireNameFromPropertySegments(
  segments: (SdkModelPropertyType | SdkMethodParameter | SdkServiceResponseHeader)[],
): string | undefined {
  if (segments[0].kind === "property") {
    return segments
      .filter((s) => s.kind === "property")
      .map((s) => {
        if (s.serializationOptions.json) {
          return s.serializationOptions.json.name;
        }
        if (s.serializationOptions.xml) {
          return s.serializationOptions.xml.name;
        }
        return "";
      })
      .join(".");
  }

  return undefined;
}

function getWireNameWithDiagnostics(
  context: PythonSdkContext,
  segments: (SdkModelPropertyType | SdkServiceResponseHeader)[] | undefined,
  code: "invalid-paging-items" | "invalid-next-link" | "invalid-lro-result",
  method?: SdkServiceMethod<SdkHttpOperation>,
): string | undefined {
  if (segments && segments.length > 0) {
    const result = getWireNameFromPropertySegments(segments);
    if (result) {
      return result;
    }
    const operationId = method ? method.name : "";
    reportDiagnostic(context.program, {
      code: code,
      target: NoTarget,
      format: { operationId: operationId },
    });
  }

  return undefined;
}

function buildContinuationToken(
  context: PythonSdkContext,
  method: SdkPagingServiceMethod<SdkHttpOperation> | SdkLroPagingServiceMethod<SdkHttpOperation>,
  segments: (SdkModelPropertyType | SdkMethodParameter | SdkServiceResponseHeader)[],
  input: boolean = true,
): Record<string, any> {
  if (segments[0].kind === "property") {
    const wireName = getWireNameFromPropertySegments(segments);
    if (wireName) {
      return { wireName, location: "body" };
    }
  } else if (input) {
    for (const parameter of method.operation.parameters) {
      if (isContinuationToken(parameter, method)) {
        return { wireName: parameter.serializedName, location: parameter.kind };
      }
    }
  } else {
    for (const response of method.operation.responses) {
      for (const header of response.headers) {
        if (isContinuationToken(header, method, false)) {
          return { wireName: header.serializedName, location: "header" };
        }
      }
    }
  }
  reportDiagnostic(context.program, {
    code: "invalid-continuation-token",
    target: NoTarget,
    format: { operationId: method.name, direction: input ? "request" : "response" },
  });
  return {};
}

function buildAllContinuationToken(
  context: PythonSdkContext,
  method: SdkPagingServiceMethod<SdkHttpOperation> | SdkLroPagingServiceMethod<SdkHttpOperation>,
): Record<string, any> {
  const parameterSegments = method.pagingMetadata.continuationTokenParameterSegments ?? [];
  const responseSegments = method.pagingMetadata.continuationTokenResponseSegments ?? [];
  if (parameterSegments.length > 0 && responseSegments.length > 0) {
    return {
      input: buildContinuationToken(context, method, parameterSegments),
      output: buildContinuationToken(context, method, responseSegments, false),
    };
  }
  return {};
}

function addPagingInformation(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  method: SdkPagingServiceMethod<SdkHttpOperation> | SdkLroPagingServiceMethod<SdkHttpOperation>,
  operationGroupName: string,
  serviceApiVersions: string[],
) {
  for (const response of method.operation.responses) {
    if (response.type) {
      const type = getType(context, response.type);
      if (type["referredByOperationType"] === undefined) {
        type["referredByOperationType"] = ReferredByOperationTypes.Default;
      }
      type["referredByOperationType"] |= ReferredByOperationTypes.PagingOnly;
    }
  }
  const itemType = getType(context, method.response.type!);
  const base = emitHttpOperation(
    context,
    rootClient,
    operationGroupName,
    method.operation,
    method,
    serviceApiVersions,
  );
  const itemName = getWireNameWithDiagnostics(
    context,
    method.response.resultSegments,
    "invalid-paging-items",
    method,
  );
  const nextLinkName = getWireNameWithDiagnostics(
    context,
    method.pagingMetadata.nextLinkSegments,
    "invalid-next-link",
    method,
  );
  base.responses.forEach((resp: Record<string, any>) => {
    resp.type = itemType;
  });
  const nextLinkReInjectedParameters: Record<string, any>[] = [];
  for (const segList of method.pagingMetadata.nextLinkReInjectedParametersSegments ?? []) {
    for (const param of segList) {
      if (param.kind === "method") {
        for (const parameter of method.operation.parameters) {
          if (parameter.kind === "query" && parameter.correspondingMethodParams.includes(param)) {
            nextLinkReInjectedParameters.push(
              emitHttpQueryParameter(context, rootClient, parameter, method, serviceApiVersions),
            );
          }
        }
      }
    }
  }
  return {
    ...base,
    name: getClientName(method),
    discriminator: "paging",
    exposeStreamKeyword: false,
    itemName,
    nextLinkName,
    nextLinkIsNested:
      method.pagingMetadata.nextLinkSegments && method.pagingMetadata.nextLinkSegments.length > 1,
    nextLinkReInjectedParameters,
    nextLinkVerb: method.pagingMetadata.nextLinkVerb,
    itemType,
    description: method.doc ?? "",
    summary: method.summary,
    continuationToken: buildAllContinuationToken(context, method),
  };
}

export function emitLroHttpMethod(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  method: SdkLroServiceMethod<SdkHttpOperation>,
  operationGroupName: string,
  serviceApiVersions: string[],
): Record<string, any>[] {
  const lroMethod = addLroInformation(
    context,
    rootClient,
    method,
    operationGroupName,
    serviceApiVersions,
  );
  return [lroMethod.initialOperation, lroMethod];
}

export function emitPagingHttpMethod(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  method: SdkPagingServiceMethod<SdkHttpOperation>,
  operationGroupName: string,
  serviceApiVersions: string[],
): Record<string, any>[] {
  const pagingMethod = addPagingInformation(
    context,
    rootClient,
    method,
    operationGroupName,
    serviceApiVersions,
  );
  return [pagingMethod];
}

export function emitLroPagingHttpMethod(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  method: SdkLroPagingServiceMethod<SdkHttpOperation>,
  operationGroupName: string,
  serviceApiVersions: string[],
): Record<string, any>[] {
  const pagingMethod = addPagingInformation(
    context,
    rootClient,
    method,
    operationGroupName,
    serviceApiVersions,
  );
  const lroMethod = addLroInformation(
    context,
    rootClient,
    method,
    operationGroupName,
    serviceApiVersions,
  );

  // merge paging method and lro method into lropaging method
  const lroPagingMethod = { ...lroMethod, ...pagingMethod, discriminator: "lropaging" };

  return [lroMethod.initialOperation, lroPagingMethod];
}

function emitHttpOperation(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  operationGroupName: string,
  operation: SdkHttpOperation,
  method: SdkServiceMethod<SdkHttpOperation>,
  serviceApiVersions: string[],
): Record<string, any> {
  const responses: Record<string, any>[] = [];
  const exceptions: Record<string, any>[] = [];
  for (const response of operation.responses) {
    responses.push(emitHttpResponse(context, response.statusCodes, response, method)!);
  }
  for (const exception of operation.exceptions) {
    exceptions.push(emitHttpResponse(context, exception.statusCodes, exception, undefined, true)!);
  }
  const result = {
    url: operation.path,
    method: operation.verb.toUpperCase(),
    parameters: emitHttpParameters(context, rootClient, operation, method, serviceApiVersions),
    bodyParameter: emitHttpBodyParameter(context, operation.bodyParam, serviceApiVersions),
    responses,
    exceptions,
    groupName: operationGroupName,
    addedOn: method ? getAddedOn(context, method, serviceApiVersions) : "",
    discriminator: "basic",
    isOverload: false,
    overloads: [],
    apiVersions: method.apiVersions,
    wantTracing: true,
    exposeStreamKeyword: true,
    crossLanguageDefinitionId: method?.crossLanguageDefinitionId,
    samples: arrayToRecord(method?.operation.examples),
    internal: method.access === "internal",
    isExactName: method.isExactName,
  };
  if (result.bodyParameter && isSpreadBody(operation.bodyParam)) {
    result.bodyParameter["propertyToParameterName"] = {};
    result.bodyParameter["defaultToUnsetSentinel"] = true;
    // if body type is not only used for this spread body, but also used in other input/output, we should clone it, then change the type base to json
    if (
      (result.bodyParameter.type.usage & UsageFlags.Input) > 0 ||
      (result.bodyParameter.type.usage & UsageFlags.Output) > 0
    ) {
      result.bodyParameter.type = { ...result.bodyParameter.type, name: `${method.name}Request` };
    }
    result.bodyParameter.type.base = "json";
    for (const property of result.bodyParameter.type.properties) {
      result.bodyParameter["propertyToParameterName"][property["wireName"]] =
        property["clientName"];
      result.parameters.push(emitFlattenedParameter(result.bodyParameter, property));
    }
  }
  return result;
}

function isSpreadBody(bodyParam: SdkBodyParameter | undefined): boolean {
  return (
    bodyParam?.type.kind === "model" &&
    bodyParam.type !== bodyParam.correspondingMethodParams[0]?.type
  );
}

function emitFlattenedParameter(
  bodyParameter: Record<string, any>,
  property: Record<string, any>,
): Record<string, any> {
  return {
    checkClientInput: false,
    clientDefaultValue: null,
    clientName: property.clientName,
    isExactName: property.isExactName,
    delimiter: null,
    description: property.description,
    implementation: "Method",
    inDocstring: true,
    inFlattenedBody: true,
    inOverload: false,
    inOverridden: false,
    isApiVersion: bodyParameter["isApiVersion"],
    location: "other",
    optional: property["optional"],
    wireName: null,
    skipUrlEncoding: false,
    type: property["type"],
    defaultToUnsetSentinel: true,
  };
}

function emitHttpPathParameter(
  context: PythonSdkContext,
  parameter: SdkPathParameter,
  operation: SdkHttpOperation,
  serviceApiVersions: string[],
): Record<string, any> {
  const base = emitParamBase(context, parameter, undefined, serviceApiVersions);
  if (parameter.optional && operation.path.includes(`/{${parameter.serializedName}}`)) {
    operation.path = operation.path.replace(
      `/{${parameter.serializedName}}`,
      `{${parameter.serializedName}}`,
    );
  }
  return {
    ...base,
    wireName: parameter.serializedName,
    location: parameter.kind,
    implementation: getImplementation(context, parameter),
    clientDefaultValue: parameter.clientDefaultValue,
    skipUrlEncoding: parameter.allowReserved,
  };
}

function emitHttpHeaderParameter(
  context: PythonSdkContext,
  parameter: SdkHeaderParameter,
  method: SdkServiceMethod<SdkHttpOperation>,
  serviceApiVersions: string[],
): Record<string, any> {
  const base = emitParamBase(context, parameter, method, serviceApiVersions);
  const [delimiter, explode] = getDelimiterAndExplode(parameter);
  let clientDefaultValue = parameter.clientDefaultValue;
  if (isContentTypeParameter(parameter)) {
    // we switch to string type for content-type header
    if (!clientDefaultValue && parameter.type.kind === "constant") {
      clientDefaultValue = parameter.type.value;
    }
    base.type = KnownTypes.string;
  }
  return {
    ...base,
    wireName: parameter.serializedName,
    location: parameter.kind,
    implementation: getImplementation(context, parameter),
    delimiter,
    explode,
    clientDefaultValue,
    etagRole: getEtagRole(parameter),
  };
}

function emitHttpQueryParameter(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  parameter: SdkQueryParameter,
  method: SdkServiceMethod<SdkHttpOperation>,
  serviceApiVersions: string[],
): Record<string, any> {
  const base = emitParamBase(context, parameter, method, serviceApiVersions);
  const [delimiter, explode] = getDelimiterAndExplode(parameter);
  return {
    ...base,
    wireName: parameter.serializedName,
    location: parameter.kind,
    implementation: parameter.isApiVersionParam
      ? rootClient.apiVersions.length > 0 && parameter.onClient
        ? "Client"
        : "Method"
      : getImplementation(context, parameter),
    delimiter,
    explode,
    clientDefaultValue: parameter.clientDefaultValue,
  };
}

function emitHttpParameters(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  operation: SdkHttpOperation,
  method: SdkServiceMethod<SdkHttpOperation>,
  serviceApiVersions: string[],
): Record<string, any>[] {
  const parameters: Record<string, any>[] = [...context.__endpointPathParameters];

  // handle @override
  const httpParameters = method.isOverride
    ? (() => {
        const parametersFromMethod = [];
        for (const param of method.parameters) {
          const httpParam = getHttpOperationParameter(method, param);
          if (httpParam) {
            // override properties of the http parameter
            httpParam.optional = param.optional;
            parametersFromMethod.push(httpParam);
          }
        }

        if (parametersFromMethod.length > 0) {
          // TCGC doesn't set apiVersion in method parameters since TCGC already set it as client level parameter.
          // But Python emitter still need it as kwargs signature of operation so we need special logic to add it if needed.
          // And same for subscriptionId.
          for (const param of operation.parameters) {
            if (
              ((param.kind === "query" && param.isApiVersionParam) ||
                (param.serializedName === "subscriptionId" && param.kind === "path")) &&
              !parametersFromMethod.find((p) => p.serializedName === param.serializedName)
            ) {
              parametersFromMethod.push(param);
            }
          }
          return parametersFromMethod;
        }

        return operation.parameters;
      })()
    : operation.parameters;

  for (const parameter of httpParameters) {
    switch (parameter.kind) {
      case "header":
        parameters.push(emitHttpHeaderParameter(context, parameter, method, serviceApiVersions));
        break;
      case "query":
        parameters.push(
          emitHttpQueryParameter(context, rootClient, parameter, method, serviceApiVersions),
        );
        break;
      case "path":
        parameters.push(emitHttpPathParameter(context, parameter, operation, serviceApiVersions));
        break;
    }
  }

  return parameters;
}

function emitHttpBodyParameter(
  context: PythonSdkContext,
  bodyParam?: SdkBodyParameter,
  serviceApiVersions: string[] = [],
): Record<string, any> | undefined {
  if (bodyParam === undefined) return undefined;
  return {
    ...emitParamBase(context, bodyParam, undefined, serviceApiVersions),
    contentTypes: bodyParam.contentTypes,
    location: bodyParam.kind,
    clientName: bodyParam.isGeneratedName ? "body" : getClientName(bodyParam),
    wireName: bodyParam.isGeneratedName ? "body" : bodyParam.name,
    implementation: getImplementation(context, bodyParam),
    clientDefaultValue: bodyParam.clientDefaultValue,
    defaultContentType: bodyParam.defaultContentType,
  };
}

function emitHttpResponse(
  context: PythonSdkContext,
  statusCodes: HttpStatusCodeRange | number | "*",
  response: SdkHttpResponse | SdkHttpErrorResponse,
  method?: SdkServiceMethod<SdkHttpOperation>,
  isException = false,
): Record<string, any> | undefined {
  if (!response) return undefined;
  let type = undefined;
  if (isException) {
    if (response.type && !isAzureCoreErrorResponse(response.type)) {
      type = getType(context, response.type);
    }
  } else if (method && !method.kind.includes("basic")) {
    if (method.response.type) {
      type = getType(context, method.response.type);
    }
  } else if (response.type) {
    type = getType(context, response.type);
  }

  if (method && type) {
    const referredBy =
      method.kind === "paging"
        ? ReferredByOperationTypes.PagingOnly
        : ReferredByOperationTypes.NonPagingOnly;
    if (type["referredByOperationType"] === undefined) {
      type["referredByOperationType"] = ReferredByOperationTypes.Default;
    }
    type["referredByOperationType"] |= referredBy;
  }

  return {
    headers: response.headers.map((x) => emitHttpResponseHeader(context, x)),
    statusCodes:
      typeof statusCodes === "object"
        ? [[(statusCodes as HttpStatusCodeRange).start, (statusCodes as HttpStatusCodeRange).end]]
        : statusCodes === "*"
          ? ["default"]
          : [statusCodes],
    discriminator: "basic",
    type,
    contentTypes: response.contentTypes,
    defaultContentType: response.defaultContentType ?? "application/json",
    resultProperty: getWireNameWithDiagnostics(
      context,
      method?.response.resultSegments,
      "invalid-lro-result",
      method,
    ),
    streaming: isException ? undefined : emitStructuredStreamingInfo(context, response),
  };
}

function emitHttpResponseHeader(
  context: PythonSdkContext,
  header: SdkServiceResponseHeader,
): Record<string, any> {
  return {
    type: getType(context, header.type),
    wireName: header.serializedName,
  };
}
