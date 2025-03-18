// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  getHttpOperationParameter,
  SdkBuiltInKinds,
  SdkContext,
  SdkHttpOperation,
  SdkHttpParameter,
  SdkHttpResponse,
  SdkModelPropertyType,
  SdkPagingServiceMethod,
  SdkServiceMethod,
  SdkServiceResponseHeader,
  SdkType,
  shouldGenerateConvenient,
  shouldGenerateProtocol,
} from "@azure-tools/typespec-client-generator-core";
import { getDeprecated, isErrorModel, NoTarget } from "@typespec/compiler";
import { HttpStatusCodeRange } from "@typespec/http";
import { getResourceOperation } from "@typespec/rest";
import { CSharpEmitterContext } from "../sdk-context.js";
import { collectionFormatToDelimMap } from "../type/collection-format.js";
import { HttpResponseHeader } from "../type/http-response-header.js";
import { InputConstant } from "../type/input-constant.js";
import { InputOperationParameterKind } from "../type/input-operation-parameter-kind.js";
import { InputOperation } from "../type/input-operation.js";
import { InputParameter } from "../type/input-parameter.js";
import { InputType } from "../type/input-type.js";
import { convertLroFinalStateVia } from "../type/operation-final-state-via.js";
import { OperationLongRunning } from "../type/operation-long-running.js";
import { ContinuationToken, NextLink, OperationPaging } from "../type/operation-paging.js";
import { OperationResponse } from "../type/operation-response.js";
import { RequestLocation } from "../type/request-location.js";
import { parseHttpRequestMethod } from "../type/request-method.js";
import { ResponseLocation } from "../type/response-location.js";
import { getExternalDocs, getOperationId } from "./decorators.js";
import { fromSdkHttpExamples } from "./example-converter.js";
import { fromSdkModelType, fromSdkType } from "./type-converter.js";

export function fromSdkServiceMethod(
  sdkContext: CSharpEmitterContext,
  method: SdkServiceMethod<SdkHttpOperation>,
  uri: string,
  rootApiVersions: string[],
): InputOperation {
  let generateConvenience = shouldGenerateConvenient(sdkContext, method.operation.__raw.operation);
  if (method.operation.verb === "patch" && generateConvenience) {
    sdkContext.logger.reportDiagnostic({
      code: "unsupported-patch-convenience-method",
      format: {
        methodCrossLanguageDefinitionId: method.crossLanguageDefinitionId,
      },
      target: method.__raw ?? NoTarget,
    });
    generateConvenience = false;
  }

  const parameterMap = fromSdkOperationParameters(sdkContext, method.operation, rootApiVersions);
  const responseMap = fromSdkHttpOperationResponses(sdkContext, method.operation.responses);
  return {
    Name: method.name,
    ResourceName:
      getResourceOperation(sdkContext.program, method.operation.__raw.operation)?.resourceType
        .name ??
      getOperationGroupName(sdkContext, method.operation, sdkContext.sdkPackage.rootNamespace),
    Deprecated: getDeprecated(sdkContext.program, method.__raw!),
    Summary: method.summary,
    Doc: method.doc,
    Accessibility: method.access,
    Parameters: [...parameterMap.values()],
    Responses: [...responseMap.values()],
    HttpMethod: parseHttpRequestMethod(method.operation.verb),
    Uri: uri,
    Path: method.operation.path,
    ExternalDocsUrl: getExternalDocs(sdkContext, method.operation.__raw.operation)?.url,
    RequestMediaTypes: getRequestMediaTypes(method.operation),
    BufferResponse: true,
    LongRunning: loadLongRunningOperation(sdkContext, method),
    Paging: loadOperationPaging(sdkContext, method, rootApiVersions, uri),
    GenerateProtocolMethod: shouldGenerateProtocol(sdkContext, method.operation.__raw.operation),
    GenerateConvenienceMethod: generateConvenience,
    CrossLanguageDefinitionId: method.crossLanguageDefinitionId,
    Decorators: method.decorators,
    Examples: method.operation.examples
      ? fromSdkHttpExamples(sdkContext, method.operation.examples, parameterMap, responseMap)
      : undefined,
  };
}

export function getParameterDefaultValue(
  sdkContext: CSharpEmitterContext,
  clientDefaultValue: any,
  parameterType: InputType,
): InputConstant | undefined {
  if (
    clientDefaultValue === undefined ||
    // a constant parameter should overwrite client default value
    parameterType.kind === "constant"
  ) {
    return undefined;
  }

  const kind = getValueType(sdkContext, clientDefaultValue);
  return {
    Type: {
      kind: kind,
      name: kind,
      crossLanguageDefinitionId: `TypeSpec.${kind}`,
    },
    Value: clientDefaultValue,
  };
}

function getValueType(sdkContext: CSharpEmitterContext, value: any): SdkBuiltInKinds {
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "int32";
    case "boolean":
      return "boolean";
    case "bigint":
      return "int64";
    default:
      sdkContext.logger.reportDiagnostic({
        code: "unsupported-default-value-type",
        format: { valueType: typeof value },
        target: NoTarget,
      });
      return "unknown";
  }
}

function fromSdkOperationParameters(
  sdkContext: CSharpEmitterContext,
  operation: SdkHttpOperation,
  rootApiVersions: string[],
): Map<SdkHttpParameter, InputParameter> {
  const parameters = new Map<SdkHttpParameter, InputParameter>();
  for (const p of operation.parameters) {
    if (p.kind === "cookie") {
      sdkContext.logger.reportDiagnostic({
        code: "unsupported-cookie-parameter",
        format: { parameterName: p.name, path: operation.path },
        target: NoTarget,
      });
      return parameters;
    }
    const param = fromSdkHttpOperationParameter(sdkContext, p, rootApiVersions);
    parameters.set(p, param);
  }

  if (operation.bodyParam) {
    const bodyParam = fromSdkHttpOperationParameter(
      sdkContext,
      operation.bodyParam,
      rootApiVersions,
    );
    parameters.set(operation.bodyParam, bodyParam);
  }
  return parameters;
}

function fromSdkHttpOperationParameter(
  sdkContext: CSharpEmitterContext,
  p: SdkModelPropertyType,
  rootApiVersions: string[],
): InputParameter {
  const isContentType =
    p.kind === "header" && p.serializedName.toLocaleLowerCase() === "content-type";
  const parameterType = fromSdkType(sdkContext, p.type);
  const format = p.kind === "header" || p.kind === "query" ? p.collectionFormat : undefined;

  // use serializedName if available, but fallback to name
  // special case for body as the name is incorrectly set to "body" https://github.com/Azure/typespec-azure/issues/2292
  const serializedName =
    "serializedName" in p && p.kind !== "body" ? (p.serializedName ?? p.name) : p.name;

  // TO-DO: In addition to checking if a path parameter is exploded, we should consider capturing the delimiter for
  // any path expansion to ensure the parameter values are delimited correctly during serialization.
  // https://github.com/microsoft/typespec/issues/5561
  const explode = isExplodedParameter(p);

  return {
    Name: p.name,
    NameInRequest: p.kind === "header" ? normalizeHeaderName(serializedName) : serializedName,
    Summary: p.summary,
    Doc: p.doc,
    Type: parameterType,
    Location: getParameterLocation(p),
    IsApiVersion:
      p.name.toLocaleLowerCase() === "apiversion" || p.name.toLocaleLowerCase() === "api-version",
    IsContentType: isContentType,
    IsEndpoint: false,
    Explode: explode,
    ArraySerializationDelimiter: format ? collectionFormatToDelimMap[format] : undefined,
    IsRequired: !p.optional,
    Kind: getParameterKind(p, parameterType, rootApiVersions.length > 0),
    DefaultValue: getParameterDefaultValue(sdkContext, p.clientDefaultValue, parameterType),
    Decorators: p.decorators,
    SkipUrlEncoding: p.kind === "path" ? p.allowReserved : false,
  } as InputParameter;
}

function loadLongRunningOperation(
  sdkContext: CSharpEmitterContext,
  method: SdkServiceMethod<SdkHttpOperation>,
): OperationLongRunning | undefined {
  if (method.kind !== "lro") {
    return undefined;
  }
  return {
    FinalStateVia: convertLroFinalStateVia(method.lroMetadata.finalStateVia),
    FinalResponse: {
      // in swagger, we allow delete to return some meaningful body content
      // for now, let assume we don't allow return type
      StatusCodes: method.operation.verb === "delete" ? [204] : [200],
      BodyType:
        method.lroMetadata.finalResponse?.envelopeResult !== undefined
          ? fromSdkModelType(sdkContext, method.lroMetadata.finalResponse.envelopeResult)
          : undefined,
    } as OperationResponse,
    ResultPath: method.lroMetadata.finalResponse?.resultPath,
  };
}

function fromSdkHttpOperationResponses(
  sdkContext: CSharpEmitterContext,
  operationResponses: SdkHttpResponse[],
): Map<SdkHttpResponse, OperationResponse> {
  const responses = new Map<SdkHttpResponse, OperationResponse>();
  for (const r of operationResponses) {
    const range = r.statusCodes;
    responses.set(r, {
      StatusCodes: toStatusCodesArray(range),
      BodyType: r.type ? fromSdkType(sdkContext, r.type) : undefined,
      Headers: fromSdkServiceResponseHeaders(sdkContext, r.headers),
      IsErrorResponse: r.type !== undefined && isErrorModel(sdkContext.program, r.type.__raw!),
      ContentTypes: r.contentTypes,
    });
  }
  return responses;
}

function fromSdkServiceResponseHeaders(
  sdkContext: CSharpEmitterContext,
  headers: SdkServiceResponseHeader[],
): HttpResponseHeader[] {
  return headers.map(
    (h) =>
      ({
        Name: h.__raw!.name,
        NameInResponse: h.serializedName,
        Summary: h.summary,
        Doc: h.doc,
        Type: fromSdkType(sdkContext, h.type),
      }) as HttpResponseHeader,
  );
}

function toStatusCodesArray(range: number | HttpStatusCodeRange): number[] {
  if (typeof range === "number") return [range];

  const statusCodes: number[] = [range.end - range.start + 1];
  for (let i = range.start; i <= range.end; i++) {
    statusCodes.push(i);
  }
  return statusCodes;
}

function getRequestMediaTypes(op: SdkHttpOperation): string[] | undefined {
  const contentTypes = op.parameters.filter(
    (p) => p.kind === "header" && p.serializedName.toLocaleLowerCase() === "content-type",
  );
  if (contentTypes.length === 0) return undefined;
  return contentTypes.map((p) => getMediaTypes(p.type)).flat();
}

function getMediaTypes(type: SdkType): string[] {
  if (type.kind === "constant") {
    if (type.valueType.kind !== "string") {
      throw `Media type in "content-type" should be string. But get ${type.valueType.kind}.`;
    }
    return [type.value as string];
  } else if (type.kind === "union") {
    const mediaTypes: string[] = [];
    for (const unionItem of type.variantTypes) {
      if (unionItem.kind === "constant" && unionItem.valueType.kind === "string") {
        mediaTypes.push(unionItem.value as string);
      } else {
        throw `Media type in "content-type" should be string. But get ${unionItem.kind}.`;
      }
    }
    return mediaTypes;
  } else if (type.kind === "enum") {
    if (type.valueType.kind !== "string") {
      throw `Media type in "content-type" should be string. But get ${type.valueType.kind}.`;
    }
    return type.values.map((v) => v.value as string);
  }
  return [];
}

function loadOperationPaging(
  context: CSharpEmitterContext,
  method: SdkServiceMethod<SdkHttpOperation>,
  rootApiVersions: string[],
  uri: string,
): OperationPaging | undefined {
  if (method.kind !== "paging" || method.pagingMetadata === undefined) {
    return undefined;
  }

  let nextLink: NextLink | undefined;
  if (method.pagingMetadata.nextLinkSegments) {
    nextLink = {
      ResponseSegments: method.pagingMetadata.nextLinkSegments.map((segment) =>
        getResponseSegmentName(segment),
      ),
      ResponseLocation: getResponseLocation(
        context,
        method,
        method.pagingMetadata.nextLinkSegments[0],
      ),
    };

    if (method.pagingMetadata.nextLinkOperation) {
      nextLink.Operation = fromSdkServiceMethod(
        context,
        method.pagingMetadata.nextLinkOperation,
        uri,
        rootApiVersions,
      );
    }
  }

  let continuationToken: ContinuationToken | undefined;

  if (
    method.pagingMetadata.continuationTokenParameterSegments &&
    method.pagingMetadata.continuationTokenResponseSegments
  ) {
    // The last segment of the service method parameter can be used to map back to the protocol parameter
    const lastParameterSegment = method.pagingMetadata.continuationTokenParameterSegments[
      method.pagingMetadata.continuationTokenParameterSegments.length - 1
    ] as SdkModelPropertyType;
    continuationToken = {
      Parameter: fromSdkHttpOperationParameter(
        context,
        getHttpOperationParameter(method, lastParameterSegment)!,
        rootApiVersions,
      ),
      ResponseSegments: method.pagingMetadata.continuationTokenResponseSegments!.map((segment) =>
        getResponseSegmentName(segment),
      ),
      ResponseLocation: getResponseLocation(
        context,
        method,
        method.pagingMetadata.continuationTokenResponseSegments?.[0],
      ),
    };
  }

  return {
    // TODO - this is hopefully temporary until TCGC provides the information directly on pagingMetadata https://github.com/Azure/typespec-azure/issues/2291
    ItemPropertySegments: method.response.resultSegments!.map((s) => s.name),
    NextLink: nextLink,
    ContinuationToken: continuationToken,
  };
}

function getResponseSegmentName(segment: SdkModelPropertyType): string {
  return segment.kind === "responseheader" || segment.kind === "body"
    ? segment.serializedName
    : segment.name;
}

function getResponseLocation(
  context: CSharpEmitterContext,
  method: SdkPagingServiceMethod<SdkHttpOperation>,
  p: SdkModelPropertyType,
): ResponseLocation {
  switch (p?.kind) {
    case "responseheader":
      return ResponseLocation.Header;
    case "property":
      return ResponseLocation.Body;
    default:
      context.logger.reportDiagnostic({
        code: "unsupported-continuation-location",
        format: {
          crossLanguageDefinitionId: method.crossLanguageDefinitionId,
        },
        target: NoTarget,
      });
      return ResponseLocation.None;
  }
}

// TODO: https://github.com/Azure/typespec-azure/issues/1441
function getParameterLocation(p: SdkModelPropertyType): RequestLocation {
  switch (p?.kind) {
    case "path":
      return RequestLocation.Path;
    case "header":
      return RequestLocation.Header;
    case "query":
      return RequestLocation.Query;
    case "body":
      return RequestLocation.Body;
    default:
      return RequestLocation.None;
  }
}

function getParameterKind(
  p: SdkModelPropertyType,
  type: InputType,
  hasGlobalApiVersion: boolean,
): InputOperationParameterKind {
  if (p.kind === "body") {
    /** TODO: remove this and use the spread metadata of parameter when https://github.com/Azure/typespec-azure/issues/1513 is resolved */
    if (type.kind === "model" && p.type !== p.correspondingMethodParams[0]?.type) {
      return InputOperationParameterKind.Spread;
    }
    return InputOperationParameterKind.Method;
  }

  return type.kind === "constant"
    ? InputOperationParameterKind.Constant
    : p.isApiVersionParam
      ? hasGlobalApiVersion
        ? InputOperationParameterKind.Client
        : InputOperationParameterKind.Method
      : p.onClient
        ? InputOperationParameterKind.Client
        : InputOperationParameterKind.Method;
}

function getOperationGroupName(
  context: SdkContext,
  operation: SdkHttpOperation,
  namespace: string,
): string {
  const explicitOperationId = getOperationId(context, operation.__raw.operation);
  if (explicitOperationId) {
    const ids: string[] = explicitOperationId.split("_");
    if (ids.length > 1) {
      return ids.slice(0, -2).join("_");
    }
  }

  if (operation.__raw.operation.interface) {
    return operation.__raw.operation.interface.name;
  }
  if (operation.__raw.operation.namespace) {
    return operation.__raw.operation.namespace.name;
  }
  return namespace;
}

// TODO: remove after https://github.com/Azure/typespec-azure/issues/1227 is fixed
function normalizeHeaderName(name: string): string {
  switch (name.toLocaleLowerCase()) {
    case "accept":
      return "Accept";
    case "content-type":
      return "Content-Type";
    default:
      return name;
  }
}

function isExplodedParameter(p: SdkModelPropertyType): boolean {
  return (p.kind === "path" || p.kind === "query") && p.explode === true;
}
