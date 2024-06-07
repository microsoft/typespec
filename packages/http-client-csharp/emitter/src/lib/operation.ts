// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { getLroMetadata } from "@azure-tools/typespec-azure-core";
import {
  SdkContext,
  getAccess,
  isApiVersion,
  shouldGenerateConvenient,
  shouldGenerateProtocol,
} from "@azure-tools/typespec-client-generator-core";
import {
  Model,
  ModelProperty,
  Namespace,
  Operation,
  getDeprecated,
  getDoc,
  getSummary,
  isErrorModel,
} from "@typespec/compiler";
import { HttpOperation, HttpOperationParameter, HttpOperationResponse } from "@typespec/http";
import { getResourceOperation } from "@typespec/rest";
import { NetEmitterOptions } from "../options.js";
import { BodyMediaType, typeToBodyMediaType } from "../type/body-media-type.js";
import { collectionFormatToDelimMap } from "../type/collection-format.js";
import { HttpResponseHeader } from "../type/http-response-header.js";
import { InputConstant } from "../type/input-constant.js";
import { InputOperationParameterKind } from "../type/input-operation-parameter-kind.js";
import { InputOperation } from "../type/input-operation.js";
import { InputParameter } from "../type/input-parameter.js";
import {
  InputEnumType,
  InputListType,
  InputModelType,
  InputType,
  isInputEnumType,
  isInputLiteralType,
  isInputModelType,
  isInputUnionType,
} from "../type/input-type.js";
import { convertLroFinalStateVia } from "../type/operation-final-state-via.js";
import { OperationLongRunning } from "../type/operation-long-running.js";
import { OperationPaging } from "../type/operation-paging.js";
import { OperationResponse } from "../type/operation-response.js";
import { RequestLocation, requestLocationMap } from "../type/request-location.js";
import { RequestMethod, parseHttpRequestMethod } from "../type/request-method.js";
import { Usage } from "../type/usage.js";
import { getExternalDocs, getOperationId, hasDecorator } from "./decorators.js";
import { Logger } from "./logger.js";
import { getDefaultValue, getEffectiveSchemaType, getInputType } from "./model.js";
import { capitalize, createContentTypeOrAcceptParameter, getTypeName } from "./utils.js";

export function loadOperation(
  sdkContext: SdkContext<NetEmitterOptions>,
  operation: HttpOperation,
  uri: string,
  urlParameters: InputParameter[] | undefined = undefined,
  serviceNamespaceType: Namespace,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
): InputOperation {
  const { path: fullPath, operation: op, verb, parameters: typespecParameters } = operation;
  const program = sdkContext.program;
  Logger.getInstance().info(`load operation: ${op.name}, path:${fullPath} `);
  const resourceOperation = getResourceOperation(program, op);
  const desc = getDoc(program, op);
  const summary = getSummary(program, op);
  const externalDocs = getExternalDocs(sdkContext, op);

  const parameters: InputParameter[] = [];
  if (urlParameters) {
    for (const param of urlParameters) {
      parameters.push(param);
    }
  }
  for (const p of typespecParameters.parameters) {
    parameters.push(loadOperationParameter(sdkContext, p));
  }

  if (typespecParameters.body?.parameter) {
    parameters.push(loadBodyParameter(sdkContext, typespecParameters.body?.parameter));
  } else if (typespecParameters.body?.type) {
    const effectiveBodyType = getEffectiveSchemaType(sdkContext, typespecParameters.body.type);
    if (effectiveBodyType.kind === "Model") {
      const bodyParameter = loadBodyParameter(sdkContext, effectiveBodyType);
      if (effectiveBodyType.name === "") {
        bodyParameter.Kind = InputOperationParameterKind.Spread;
      }
      // TODO: remove this after https://github.com/Azure/typespec-azure/issues/69 is resolved
      // workaround for alias model
      if (isInputModelType(bodyParameter.Type) && bodyParameter.Type.Name === "") {
        // give body type a name
        bodyParameter.Type.Name = `${capitalize(op.name)}Request`;
        const bodyModelType = bodyParameter.Type as InputModelType;
        bodyModelType.Usage = Usage.Input;
        // update models cache
        models.delete("");
        models.set(bodyModelType.Name, bodyModelType);

        // give body parameter a name
        bodyParameter.Name = `${capitalize(op.name)}Request`;
      }
      parameters.push(bodyParameter);
    }
  }

  const responses: OperationResponse[] = [];
  for (const res of operation.responses) {
    const operationResponse = loadOperationResponse(sdkContext, res);
    if (operationResponse) {
      responses.push(operationResponse);
    }
    if (operationResponse?.ContentTypes && operationResponse.ContentTypes.length > 0) {
      const acceptParameter = createContentTypeOrAcceptParameter(
        [operationResponse.ContentTypes[0]], // We currently only support one content type per response
        "accept",
        "Accept"
      );
      const acceptIndex = parameters.findIndex((p) => p.NameInRequest.toLowerCase() === "accept");
      if (acceptIndex > -1) {
        parameters.splice(acceptIndex, 1, acceptParameter);
      } else {
        parameters.push(acceptParameter);
      }
    }
  }

  const mediaTypes: string[] = [];
  const contentTypeParameter = parameters.find((value) => value.IsContentType);
  if (contentTypeParameter) {
    if (isInputLiteralType(contentTypeParameter.Type)) {
      mediaTypes.push(contentTypeParameter.DefaultValue?.Value);
    } else if (isInputUnionType(contentTypeParameter.Type)) {
      for (const unionItem of contentTypeParameter.Type.VariantTypes) {
        if (isInputLiteralType(unionItem)) {
          mediaTypes.push(unionItem.Value as string);
        } else {
          throw "Media type of content type should be string.";
        }
      }
    } else if (isInputEnumType(contentTypeParameter.Type)) {
      const mediaTypeValues = contentTypeParameter.Type.Values.map((value) => value.Value);
      if (mediaTypeValues.some((item) => item === undefined)) {
        throw "Media type of content type should be string.";
      }
      mediaTypes.push(...mediaTypeValues);
    }
  }
  const requestMethod = parseHttpRequestMethod(verb);
  const generateProtocol: boolean = shouldGenerateProtocol(sdkContext, op);
  const generateConvenience: boolean =
    requestMethod !== RequestMethod.PATCH && shouldGenerateConvenient(sdkContext, op);

  /* handle lro */
  /* handle paging. */
  let paging: OperationPaging | undefined = undefined;
  for (const res of operation.responses) {
    const body = res.responses[0]?.body;
    if (body?.type) {
      const bodyType = getEffectiveSchemaType(sdkContext, body.type);
      if (bodyType.kind === "Model" && hasDecorator(bodyType, "$pagedResult")) {
        const itemsProperty = Array.from(bodyType.properties.values()).find((it) =>
          hasDecorator(it, "$items")
        );
        const nextLinkProperty = Array.from(bodyType.properties.values()).find((it) =>
          hasDecorator(it, "$nextLink")
        );
        paging = {
          NextLinkName: nextLinkProperty?.name,
          ItemName: itemsProperty?.name,
        } as OperationPaging;
      }
    }
  }
  /* TODO: handle lro */

  return {
    Name: getTypeName(sdkContext, op),
    ResourceName:
      resourceOperation?.resourceType.name ??
      getOperationGroupName(sdkContext, op, serviceNamespaceType),
    Summary: summary,
    Deprecated: getDeprecated(program, op),
    Description: desc,
    Accessibility: getAccess(sdkContext, op),
    Parameters: parameters,
    Responses: responses,
    HttpMethod: requestMethod,
    RequestBodyMediaType: typeToBodyMediaType(typespecParameters.body?.type),
    Uri: uri,
    Path: fullPath,
    ExternalDocsUrl: externalDocs?.url,
    RequestMediaTypes: mediaTypes.length > 0 ? mediaTypes : undefined,
    BufferResponse: true,
    LongRunning: loadLongRunningOperation(sdkContext, operation),
    Paging: paging,
    GenerateProtocolMethod: generateProtocol,
    GenerateConvenienceMethod: generateConvenience,
  } as InputOperation;

  function loadOperationParameter(
    context: SdkContext<NetEmitterOptions>,
    parameter: HttpOperationParameter
  ): InputParameter {
    const { type: location, name, param } = parameter;
    const format = parameter.type === "path" ? undefined : parameter.format;
    const typespecType = param.type;
    const inputType: InputType = getInputType(context, param, models, enums, operation.operation);
    let defaultValue: InputConstant | undefined = undefined;
    const value = getDefaultValue(typespecType);
    if (value) {
      defaultValue = {
        Type: inputType,
        Value: value,
      };
    }
    const requestLocation = requestLocationMap[location];
    const isApiVer: boolean = isApiVersion(sdkContext, parameter);
    const isContentType: boolean =
      requestLocation === RequestLocation.Header && name.toLowerCase() === "content-type";
    const kind: InputOperationParameterKind =
      isContentType || inputType.Kind === "constant"
        ? InputOperationParameterKind.Constant
        : isApiVer
          ? defaultValue
            ? InputOperationParameterKind.Constant
            : InputOperationParameterKind.Client
          : InputOperationParameterKind.Method;
    return {
      Name: getTypeName(sdkContext, param),
      NameInRequest: name,
      Description: getDoc(program, param),
      Type: inputType,
      Location: requestLocation,
      DefaultValue: defaultValue,
      IsRequired: !param.optional,
      IsApiVersion: isApiVer,
      IsResourceParameter: false,
      IsContentType: isContentType,
      IsEndpoint: false,
      SkipUrlEncoding: false, //TODO: retrieve out value from extension
      Explode: (inputType as InputListType).ElementType && format === "multi" ? true : false,
      Kind: kind,
      ArraySerializationDelimiter: format ? collectionFormatToDelimMap[format] : undefined,
    } as InputParameter;
  }

  function loadBodyParameter(
    context: SdkContext<NetEmitterOptions>,
    body: ModelProperty | Model
  ): InputParameter {
    const inputType: InputType = getInputType(context, body, models, enums, operation.operation);
    const requestLocation = RequestLocation.Body;
    const kind: InputOperationParameterKind = InputOperationParameterKind.Method;
    return {
      Name: getTypeName(context, body),
      NameInRequest: body.name,
      Description: getDoc(program, body),
      Type: inputType,
      Location: requestLocation,
      IsRequired: body.kind === "Model" ? true : !body.optional,
      IsApiVersion: false,
      IsResourceParameter: false,
      IsContentType: false,
      IsEndpoint: false,
      SkipUrlEncoding: false,
      Explode: false,
      Kind: kind,
    } as InputParameter;
  }

  function loadOperationResponse(
    context: SdkContext<NetEmitterOptions>,
    response: HttpOperationResponse
  ): OperationResponse | undefined {
    if (!response.statusCode || response.statusCode === "*") {
      return undefined;
    }
    const status: number[] = [];
    status.push(Number(response.statusCode));
    //TODO: what to do if more than 1 response?
    const body = response.responses[0]?.body;

    let type: InputType | undefined = undefined;
    if (body?.type) {
      const typespecType = getEffectiveSchemaType(context, body.type);
      const inputType: InputType = getInputType(
        context,
        typespecType,
        models,
        enums,
        operation.operation
      );
      type = inputType;
    }

    const headers = response.responses[0]?.headers;
    const responseHeaders: HttpResponseHeader[] = [];
    if (headers) {
      for (const key of Object.keys(headers)) {
        responseHeaders.push({
          Name: key,
          NameInResponse: headers[key].name,
          Description: getDoc(program, headers[key]) ?? "",
          Type: getInputType(context, headers[key].type, models, enums, operation.operation),
        } as HttpResponseHeader);
      }
    }

    return {
      StatusCodes: status,
      BodyType: type,
      BodyMediaType: BodyMediaType.Json,
      Headers: responseHeaders,
      IsErrorResponse: isErrorModel(program, response.type),
      ContentTypes: body?.contentTypes,
    } as OperationResponse;
  }

  function loadLongRunningOperation(
    context: SdkContext<NetEmitterOptions>,
    op: HttpOperation
  ): OperationLongRunning | undefined {
    const metadata = getLroMetadata(program, op.operation);
    if (metadata === undefined) {
      return undefined;
    }

    let bodyType: InputType | undefined = undefined;
    if (
      op.verb !== "delete" &&
      metadata.finalResult !== undefined &&
      metadata.finalResult !== "void"
    ) {
      bodyType = getInputType(
        context,
        metadata.finalEnvelopeResult as Model,
        models,
        enums,
        op.operation
      );
    }

    return {
      FinalStateVia: convertLroFinalStateVia(metadata.finalStateVia),
      FinalResponse: {
        // in swagger, we allow delete to return some meaningful body content
        // for now, let assume we don't allow return type
        StatusCodes: op.verb === "delete" ? [204] : [200],
        BodyType: bodyType,
        BodyMediaType: BodyMediaType.Json,
      } as OperationResponse,
      ResultPath: metadata.finalResultPath,
    } as OperationLongRunning;
  }
}

function getOperationGroupName(
  context: SdkContext,
  operation: Operation,
  serviceNamespaceType: Namespace
): string {
  const explicitOperationId = getOperationId(context, operation);
  if (explicitOperationId) {
    const ids: string[] = explicitOperationId.split("_");
    if (ids.length > 1) {
      return ids.slice(0, -2).join("_");
    }
  }

  if (operation.interface) {
    return operation.interface.name;
  }
  let namespace = operation.namespace;
  if (!namespace) {
    namespace = context.program.checker.getGlobalNamespaceType() ?? serviceNamespaceType;
  }

  if (namespace) return namespace.name;
  else return "";
}
