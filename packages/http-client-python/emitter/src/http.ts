import { NoTarget } from "@typespec/compiler";

import {
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
  SdkModelPropertyType,
  SdkPagingServiceMethod,
  SdkPathParameter,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkServiceResponseHeader,
  UsageFlags,
} from "@azure-tools/typespec-client-generator-core";
import { HttpStatusCodeRange } from "@typespec/http";
import { PythonSdkContext, reportDiagnostic } from "./lib.js";
import { KnownTypes, getType } from "./types.js";
import {
  camelToSnakeCase,
  emitParamBase,
  getAddedOn,
  getDelimiterAndExplode,
  getImplementation,
  isAbstract,
  isAzureCoreErrorResponse,
  isContinuationToken,
} from "./utils.js";

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
): Record<string, any>[] {
  return [
    {
      ...emitHttpOperation(context, rootClient, operationGroupName, method.operation, method),
      abstract: isAbstract(method),
      name: camelToSnakeCase(method.name),
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
): Record<string, any> {
  return {
    ...emitHttpOperation(context, rootClient, operationGroupName, method.operation, method),
    name: `_${camelToSnakeCase(method.name)}_initial`,
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
) {
  return {
    ...emitHttpOperation(context, rootClient, operationGroupName, method.operation, method),
    name: camelToSnakeCase(method.name),
    discriminator: "lro",
    initialOperation: emitInitialLroHttpMethod(context, rootClient, method, operationGroupName),
    exposeStreamKeyword: false,
    description: method.doc ?? "",
    summary: method.summary,
  };
}

function getWireNameFromPropertySegments(segments: SdkModelPropertyType[]): string | undefined {
  if (segments[0].kind === "property") {
    return segments
      .filter((s) => s.kind === "property")
      .map((s) => s.serializationOptions.json?.name ?? "")
      .join(".");
  }

  return undefined;
}

function getWireNameWithDiagnostics(
  context: PythonSdkContext,
  segments: SdkModelPropertyType[] | undefined,
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
  segments: SdkModelPropertyType[],
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
) {
  for (const response of method.operation.responses) {
    if (response.type) {
      getType(context, response.type)["usage"] = UsageFlags.None;
    }
  }
  const itemType = getType(context, method.response.type!);
  const base = emitHttpOperation(context, rootClient, operationGroupName, method.operation, method);
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
  return {
    ...base,
    name: camelToSnakeCase(method.name),
    discriminator: "paging",
    exposeStreamKeyword: false,
    itemName,
    nextLinkName,
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
): Record<string, any>[] {
  const lroMethod = addLroInformation(context, rootClient, method, operationGroupName);
  return [lroMethod.initialOperation, lroMethod];
}

export function emitPagingHttpMethod(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  method: SdkPagingServiceMethod<SdkHttpOperation>,
  operationGroupName: string,
): Record<string, any>[] {
  const pagingMethod = addPagingInformation(context, rootClient, method, operationGroupName);
  return [pagingMethod];
}

export function emitLroPagingHttpMethod(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  method: SdkLroPagingServiceMethod<SdkHttpOperation>,
  operationGroupName: string,
): Record<string, any>[] {
  const pagingMethod = addPagingInformation(context, rootClient, method, operationGroupName);
  const lroMethod = addLroInformation(context, rootClient, method, operationGroupName);
  return [lroMethod.initialOperation, pagingMethod, lroMethod];
}

function emitHttpOperation(
  context: PythonSdkContext,
  rootClient: SdkClientType<SdkHttpOperation>,
  operationGroupName: string,
  operation: SdkHttpOperation,
  method: SdkServiceMethod<SdkHttpOperation>,
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
    parameters: emitHttpParameters(context, rootClient, operation, method),
    bodyParameter: emitHttpBodyParameter(context, operation.bodyParam),
    responses,
    exceptions,
    groupName: operationGroupName,
    addedOn: method ? getAddedOn(context, method) : "",
    discriminator: "basic",
    isOverload: false,
    overloads: [],
    apiVersions: [],
    wantTracing: true,
    exposeStreamKeyword: true,
    crossLanguageDefinitionId: method?.crossLanguageDefinitionId,
    samples: arrayToRecord(method?.operation.examples),
    internal: method.access === "internal",
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

function emitHttpPathParameter(context: PythonSdkContext, parameter: SdkPathParameter) {
  const base = emitParamBase(context, parameter);
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
): Record<string, any> {
  const base = emitParamBase(context, parameter, method);
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
  };
}

function emitHttpQueryParameter(
  context: PythonSdkContext,
  parameter: SdkQueryParameter,
  method: SdkServiceMethod<SdkHttpOperation>,
): Record<string, any> {
  const base = emitParamBase(context, parameter, method);
  const [delimiter, explode] = getDelimiterAndExplode(parameter);
  return {
    ...base,
    wireName: parameter.serializedName,
    location: parameter.kind,
    implementation: getImplementation(context, parameter),
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
): Record<string, any>[] {
  const parameters: Record<string, any>[] = [...context.__endpointPathParameters];
  for (const parameter of operation.parameters) {
    switch (parameter.kind) {
      case "header":
        parameters.push(emitHttpHeaderParameter(context, parameter, method));
        break;
      case "query":
        parameters.push(emitHttpQueryParameter(context, parameter, method));
        break;
      case "path":
        parameters.push(emitHttpPathParameter(context, parameter));
        break;
    }
  }
  return parameters;
}

function emitHttpBodyParameter(
  context: PythonSdkContext,
  bodyParam?: SdkBodyParameter,
): Record<string, any> | undefined {
  if (bodyParam === undefined) return undefined;
  return {
    ...emitParamBase(context, bodyParam),
    contentTypes: bodyParam.contentTypes,
    location: bodyParam.kind,
    clientName: bodyParam.isGeneratedName ? "body" : camelToSnakeCase(bodyParam.name),
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
