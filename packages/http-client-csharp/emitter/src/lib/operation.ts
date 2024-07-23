// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkBodyParameter,
  SdkBuiltInKinds,
  SdkBuiltInType,
  SdkContext,
  SdkHeaderParameter,
  SdkHttpOperation,
  SdkPathParameter,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkServiceResponseHeader,
  SdkType,
  shouldGenerateConvenient,
  shouldGenerateProtocol,
} from "@azure-tools/typespec-client-generator-core";
import { getDeprecated, getDoc, getSummary, isErrorModel } from "@typespec/compiler";
import { HttpStatusCodeRange } from "@typespec/http";
import { getResourceOperation } from "@typespec/rest";
import { NetEmitterOptions } from "../options.js";
import { BodyMediaType } from "../type/body-media-type.js";
import { collectionFormatToDelimMap } from "../type/collection-format.js";
import { HttpResponseHeader } from "../type/http-response-header.js";
import { InputConstant } from "../type/input-constant.js";
import { InputOperationParameterKind } from "../type/input-operation-parameter-kind.js";
import { InputOperation } from "../type/input-operation.js";
import { InputParameter } from "../type/input-parameter.js";
import {
  InputEnumType,
  InputModelType,
  InputPrimitiveType,
  InputType,
} from "../type/input-type.js";
import { convertLroFinalStateVia } from "../type/operation-final-state-via.js";
import OperationPaging from "../type/operation-paging.js";
import { OperationResponse } from "../type/operation-response.js";
import { RequestLocation } from "../type/request-location.js";
import { parseHttpRequestMethod } from "../type/request-method.js";
import { fromSdkType } from "./converter.js";
import { getExternalDocs, getOperationId } from "./decorators.js";
import { getInputType } from "./model.js";

export function fromSdkServiceMethod(
  method: SdkServiceMethod<SdkHttpOperation>,
  uri: string,
  clientParameters: InputParameter[],
  rootApiVersions: string[],
  sdkContext: SdkContext<NetEmitterOptions>,
  modelMap: Map<string, InputModelType>,
  enumMap: Map<string, InputEnumType>
): InputOperation {
  return {
    Name: method.name,
    ResourceName:
      getResourceOperation(sdkContext.program, method.operation.__raw.operation)?.resourceType
        .name ?? getResourceName(sdkContext, method.operation, sdkContext.sdkPackage.rootNamespace),
    Deprecated: getDeprecated(sdkContext.program, method.__raw!),
    // TODO: we need to figure out how we want to handle summary and description
    // Right now, we generate garbage <remarks> for some APIs like `Platform-OpenAI-TypeSpec`
    Summary: getSummary(sdkContext.program, method.__raw!),
    Description: getDoc(sdkContext.program, method.__raw!),
    Accessibility: method.access,
    Parameters: getMethodParameters(
      method,
      clientParameters,
      rootApiVersions,
      sdkContext,
      modelMap,
      enumMap
    ),
    Responses: getSdkMethodResponses(method, sdkContext, modelMap, enumMap),
    HttpMethod: parseHttpRequestMethod(method.operation.verb),
    RequestBodyMediaType: sdkTypeToBodyMediaType(method.operation.bodyParam?.type),
    Uri: uri,
    Path: method.operation.path,
    ExternalDocsUrl: getExternalDocs(sdkContext, method.operation.__raw.operation)?.url,
    RequestMediaTypes: getRequestMediaTypes(method.operation),
    BufferResponse: true,
    LongRunning: loadLongRunningOperation(method, sdkContext, modelMap, enumMap),
    Paging: loadOperationPaging(method),
    GenerateProtocolMethod: shouldGenerateProtocol(sdkContext, method.operation.__raw.operation),
    GenerateConvenienceMethod:
      method.operation.verb !== "patch" &&
      shouldGenerateConvenient(sdkContext, method.operation.__raw.operation),
  };
}

export function getParameterDefaultValue(
  clientDefaultValue: any,
  parameterType: InputType
): InputConstant | undefined {
  if (
    clientDefaultValue === undefined ||
    // a constant parameter should overwrite client default value
    parameterType.Kind === "constant"
  ) {
    return undefined;
  }

  return {
    Type: {
      Kind: getValueType(clientDefaultValue),
    },
    Value: clientDefaultValue,
  };
}

function getValueType(value: any): SdkBuiltInKinds {
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
      throw new Error(`Unsupported default value type: ${typeof value}`);
  }
}

function getMethodParameters(
  method: SdkServiceMethod<SdkHttpOperation>,
  clientParameters: InputParameter[],
  rootApiVersions: string[],
  sdkContext: SdkContext<NetEmitterOptions>,
  modelMap: Map<string, InputModelType>,
  enumMap: Map<string, InputEnumType>
): InputParameter[] {
  const params = clientParameters.concat(
    method.operation.parameters.map((p) =>
      fromHttpOperationParameter(
        p,
        rootApiVersions,
        sdkContext,
        modelMap,
        enumMap,
        method // TODO: remove this after https://github.com/Azure/typespec-azure/issues/1150
      )
    )
  );
  return method.operation.bodyParam
    ? params.concat(
        fromHttpOperationParameter(
          method.operation.bodyParam,
          rootApiVersions,
          sdkContext,
          modelMap,
          enumMap,
          method
        )
      )
    : params;
}

// TODO: roll back to SdkMethodParameter when we figure out how to represent the parameter location
// https://github.com/Azure/typespec-azure/issues/981
function fromHttpOperationParameter(
  p: SdkPathParameter | SdkQueryParameter | SdkHeaderParameter | SdkBodyParameter,
  rootApiVersions: string[],
  sdkContext: SdkContext<NetEmitterOptions>,
  modelMap: Map<string, InputModelType>,
  enumMap: Map<string, InputEnumType>,
  method: SdkServiceMethod<SdkHttpOperation>
): InputParameter {
  const isContentType =
    p.kind === "header" && p.serializedName.toLocaleLowerCase() === "content-type";
  const parameterType = fromSdkType(p.type, sdkContext, modelMap, enumMap);
  // remove this after: https://github.com/Azure/typespec-azure/issues/1084
  if (p.type.kind === "bytes") {
    (parameterType as InputPrimitiveType).Encode = (
      p.correspondingMethodParams[0].type as SdkBuiltInType
    ).encode;
  }
  const format = p.kind === "header" || p.kind === "query" ? p.collectionFormat : undefined;
  const serializedName = p.kind !== "body" ? p.serializedName : p.name;

  return {
    Name: p.name !== "" ? p.name : `${method.name}Content`, // TODO: remove this after https://github.com/Azure/typespec-azure/issues/1150
    NameInRequest: serializedName,
    Description: p.description,
    Type: parameterType,
    Location: getParameterLocation(p),
    IsApiVersion:
      p.name.toLocaleLowerCase() === "apiversion" || p.name.toLocaleLowerCase() === "api-version",
    IsContentType: isContentType,
    IsEndpoint: false,
    Explode: parameterType.Kind === "array" && format === "multi" ? true : false,
    ArraySerializationDelimiter: format ? collectionFormatToDelimMap[format] : undefined,
    IsRequired: !p.optional,
    Kind: getParameterKind(p, parameterType, isContentType, rootApiVersions.length > 0),
    DefaultValue: getParameterDefaultValue(p.clientDefaultValue, parameterType),
  } as InputParameter;
}

function loadLongRunningOperation(
  method: SdkServiceMethod<SdkHttpOperation>,
  sdkContext: SdkContext<NetEmitterOptions>,
  modelMap: Map<string, InputModelType>,
  enumMap: Map<string, InputEnumType>
): import("../type/operation-long-running.js").OperationLongRunning | undefined {
  if (method.kind !== "lro") {
    return undefined;
  }

  return {
    FinalStateVia: convertLroFinalStateVia(method.__raw_lro_metadata.finalStateVia),
    FinalResponse: {
      // in swagger, we allow delete to return some meaningful body content
      // for now, let assume we don't allow return type
      StatusCodes: method.operation.verb === "delete" ? [204] : [200],
      BodyType:
        method.__raw_lro_metadata.finalEnvelopeResult &&
        method.__raw_lro_metadata.finalEnvelopeResult !== "void"
          ? getInputType(
              sdkContext,
              method.__raw_lro_metadata.finalEnvelopeResult,
              modelMap,
              enumMap,
              method.operation.__raw.operation
            )
          : undefined,
      BodyMediaType: BodyMediaType.Json,
    } as OperationResponse,
    ResultPath: method.__raw_lro_metadata.finalResultPath,
  };
}
function getSdkMethodResponses(
  method: SdkServiceMethod<SdkHttpOperation>,
  sdkContext: SdkContext<NetEmitterOptions>,
  modelMap: Map<string, InputModelType>,
  enumMap: Map<string, InputEnumType>
): OperationResponse[] {
  const responses: OperationResponse[] = [];
  method.operation.responses.forEach((r, range) => {
    responses.push({
      StatusCodes: toStatusCodesArray(range),
      BodyType: r.type ? fromSdkType(r.type, sdkContext, modelMap, enumMap) : undefined,
      BodyMediaType: BodyMediaType.Json,
      Headers: toHttpResponseHeaders(r.headers, sdkContext, modelMap, enumMap),
      IsErrorResponse: r.type !== undefined && isErrorModel(sdkContext.program, r.type.__raw!),
      // TODO: https://github.com/Azure/typespec-azure/issues/992
      ContentTypes: r.contentTypes && r.contentTypes.length > 0 ? r.contentTypes : undefined,
    });
  });
  return responses;
}

function toHttpResponseHeaders(
  headers: SdkServiceResponseHeader[],
  sdkContext: SdkContext<NetEmitterOptions>,
  modelMap: Map<string, InputModelType>,
  enumMap: Map<string, InputEnumType>
): HttpResponseHeader[] {
  return headers.map(
    (h) =>
      ({
        Name: h.__raw!.name,
        NameInResponse: h.serializedName,
        Description: h.description,
        Type: fromSdkType(h.type, sdkContext, modelMap, enumMap),
      }) as HttpResponseHeader
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

function sdkTypeToBodyMediaType(type: SdkType | undefined) {
  if (type === undefined) {
    return BodyMediaType.None;
  }

  if (type.kind === "model") {
    return BodyMediaType.Json;
  } else if (type.kind === "string") {
    return BodyMediaType.Text;
  } else if (type.kind === "bytes") {
    return BodyMediaType.Binary;
  }
  return BodyMediaType.None;
}

function getRequestMediaTypes(op: SdkHttpOperation): string[] | undefined {
  const contentTypes = op.parameters.filter(
    (p) => p.kind === "header" && p.serializedName.toLocaleLowerCase() === "content-type"
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
    for (const unionItem of type.values) {
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
  method: SdkServiceMethod<SdkHttpOperation>
): OperationPaging | undefined {
  if (method.kind !== "paging") {
    return undefined;
  }

  return {
    ItemName: method.__raw_paged_metadata.itemsProperty?.name,
    NextLinkName: method.__raw_paged_metadata.nextLinkProperty?.name,
  };
}

// TODO: https://github.com/Azure/typespec-azure/issues/981
function getParameterLocation(
  p: SdkPathParameter | SdkQueryParameter | SdkHeaderParameter | SdkBodyParameter | undefined
): RequestLocation {
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
  p: SdkPathParameter | SdkQueryParameter | SdkHeaderParameter | SdkBodyParameter,
  type: InputType,
  isContentType: boolean,
  hasGlobalApiVersion: boolean
): InputOperationParameterKind {
  if (p.kind === "body") {
    switch (p.correspondingMethodParams.length) {
      case 0:
        throw new Error(`Body parameter "${p.name}" should have corresponding method parameter.`);
      case 1:
        return isSameType(p.correspondingMethodParams[0].type, p.type)
          ? InputOperationParameterKind.Method
          : InputOperationParameterKind.Spread;
      default:
        return InputOperationParameterKind.Spread;
    }
  }
  return isContentType || type.Kind === "constant"
    ? InputOperationParameterKind.Constant
    : p.isApiVersionParam
      ? hasGlobalApiVersion
        ? InputOperationParameterKind.Client
        : InputOperationParameterKind.Method
      : InputOperationParameterKind.Method;
}
export function getResourceName(
  context: SdkContext,
  operation: SdkHttpOperation,
  namespace: string
): string {
  const explicitOperationId = getOperationId(context, operation.__raw.operation);
  if (explicitOperationId) {
    const ids: string[] = explicitOperationId.split("_");
    if (ids.length > 1) {
      return ids.slice(0, -2).join("_");
    }
  }

  // TODO: not sure if this is the right way to get the resource name
  if (operation.__raw.operation.interface) {
    return operation.__raw.operation.interface.name;
  }
  if (operation.__raw.operation.namespace) {
    return operation.__raw.operation.namespace.name;
  }
  return namespace;
}

function isSameType(src: SdkType, target: SdkType) {
  if (src.kind !== target.kind) return false;

  if (src.kind === "model" && target.kind === "model") {
    return src.name === target.name;
  }
  // TODO: more type comparison
  return true;
}
