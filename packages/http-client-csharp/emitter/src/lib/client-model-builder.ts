// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType,
  SdkContext,
  SdkEndpointParameter,
  SdkHttpOperation,
  SdkServiceMethod,
  getAllModels,
} from "@azure-tools/typespec-client-generator-core";
import { HttpOperation } from "@typespec/http";
import { NetEmitterOptions, resolveOptions } from "../options.js";
import { CodeModel } from "../type/code-model.js";
import { InputClient } from "../type/input-client.js";
import { InputOperationParameterKind } from "../type/input-operation-parameter-kind.js";
import { InputParameter } from "../type/input-parameter.js";
import { InputEnumType, InputModelType, InputPrimitiveType } from "../type/input-type.js";
import { RequestLocation } from "../type/request-location.js";
import { Usage } from "../type/usage.js";
import { fromSdkType } from "./converter.js";
import { Logger } from "./logger.js";
import { getUsages, navigateModels } from "./model.js";
import { fromSdkServiceMethod, getParameterDefaultValue } from "./operation.js";
import { processServiceAuthentication } from "./service-authentication.js";

export function createModel(sdkContext: SdkContext<NetEmitterOptions>): CodeModel {
  // initialize tcgc model
  if (!sdkContext.operationModelsMap) getAllModels(sdkContext);

  const sdkPackage = sdkContext.sdkPackage;

  const modelMap = new Map<string, InputModelType>();
  const enumMap = new Map<string, InputEnumType>();

  navigateModels(sdkContext, modelMap, enumMap);

  // TODO: do we still need to re-calculate usage from TCGC methods?
  const convenienceOperations: HttpOperation[] = [];
  const usages = getUsages(sdkContext, convenienceOperations, modelMap);
  setUsage(usages, modelMap);
  setUsage(usages, enumMap);

  const rootApiVersions = getRootApiVersions(sdkPackage.clients);

  const inputClients: InputClient[] = [];
  fromSdkClients(
    sdkPackage.clients.filter((c) => c.initialization.access === "public"),
    inputClients,
    []
  );

  const clientModel = {
    Name: sdkPackage.rootNamespace,
    ApiVersions: rootApiVersions,
    Enums: Array.from(enumMap.values()),
    Models: Array.from(modelMap.values()),
    Clients: inputClients,
    Auth: processServiceAuthentication(sdkPackage),
  } as CodeModel;
  return clientModel;

  function fromSdkClients(
    clients: SdkClientType<SdkHttpOperation>[],
    inputClients: InputClient[],
    parentClientNames: string[]
  ) {
    for (const client of clients) {
      const inputClient = emitClient(client, parentClientNames);
      inputClients.push(inputClient);
      const subClients = client.methods
        .filter((m) => m.kind === "clientaccessor")
        .map((m) => m.response);
      parentClientNames.push(inputClient.Name);
      fromSdkClients(subClients, inputClients, parentClientNames);
      parentClientNames.pop();
    }
  }

  function emitClient(client: SdkClientType<SdkHttpOperation>, parentNames: string[]): InputClient {
    const endpointParameter = client.initialization.properties.find(
      (p) => p.kind === "endpoint"
    ) as SdkEndpointParameter;
    const uri = getMethodUri(endpointParameter);
    const clientParameters = fromSdkEndpointParameter(endpointParameter);
    return {
      Name: getClientName(client, parentNames),
      Description: client.description,
      Operations: client.methods
        .filter((m) => m.kind !== "clientaccessor")
        .map((m) =>
          fromSdkServiceMethod(
            m as SdkServiceMethod<SdkHttpOperation>,
            uri,
            clientParameters,
            rootApiVersions,
            sdkContext,
            modelMap,
            enumMap
          )
        ),
      Protocol: {},
      Parent: parentNames.length > 0 ? parentNames[parentNames.length - 1] : undefined,
      Parameters: clientParameters,
    };
  }

  function getClientName(
    client: SdkClientType<SdkHttpOperation>,
    parentClientNames: string[]
  ): string {
    const clientName = client.name;

    if (parentClientNames.length === 0) return clientName;
    if (parentClientNames.length >= 2)
      return `${parentClientNames.slice(parentClientNames.length - 1).join("")}${clientName}`;

    if (
      clientName === "Models" &&
      resolveOptions(sdkContext.emitContext)["model-namespace"] !== false
    ) {
      Logger.getInstance().warn(`Invalid client name "${clientName}"`);
      return "ModelsOps";
    }

    return clientName;
  }

  function fromSdkEndpointParameter(p: SdkEndpointParameter): InputParameter[] {
    if (p.type.templateArguments.length === 0)
      return [
        {
          Name: p.name,
          NameInRequest: p.serializedName ?? p.name,
          Type: fromSdkType(p.type, sdkContext, modelMap, enumMap),
          Location: RequestLocation.Uri,
          IsApiVersion: false,
          IsResourceParameter: false,
          IsContentType: false,
          IsRequired: true,
          IsEndpoint: true,
          SkipUrlEncoding: false,
          Explode: false,
          Kind: InputOperationParameterKind.Client,
          DefaultValue: {
            Type: {
              Kind: "string",
            },
            Value: p.type.serverUrl,
          },
        },
      ];

    // TODO: support free-style endpoint url with multiple parameters
    const endpointExpr = p.type.serverUrl
      .replace("https://", "")
      .replace("http://", "")
      .split("/")[0];
    if (!/^\{\w+\}$/.test(endpointExpr))
      throw new Error(`Unsupported server url "${p.type.serverUrl}"`);
    const endpointVariableName = endpointExpr.substring(1, endpointExpr.length - 1);

    const parameters: InputParameter[] = [];
    for (const parameter of p.type.templateArguments) {
      const isEndpoint = parameter.name === endpointVariableName;
      const parameterType = isEndpoint
        ? ({
            Kind: "uri",
          } as InputPrimitiveType)
        : fromSdkType(parameter.type, sdkContext, modelMap, enumMap);
      parameters.push({
        Name: parameter.name,
        NameInRequest: parameter.serializedName,
        // TODO: we should do the magic in generator
        Type: parameterType,
        Location: RequestLocation.Uri,
        // TODO: do we have a better way to check if a parameter is api-version?
        IsApiVersion:
          parameter.name.toLowerCase() === "apiversion" ||
          parameter.name.toLowerCase() === "api-version",
        IsResourceParameter: false,
        IsContentType: false,
        IsRequired: !parameter.optional,
        IsEndpoint: isEndpoint,
        SkipUrlEncoding: false,
        Explode: false,
        Kind: InputOperationParameterKind.Client,
        DefaultValue: getParameterDefaultValue(parameter.clientDefaultValue, parameterType),
      });
    }
    return parameters;
  }
}

function setUsage(
  usages: { inputs: string[]; outputs: string[]; roundTrips: string[] },
  models: Map<string, InputModelType | InputEnumType>
) {
  for (const [name, m] of models) {
    if (m.Usage !== undefined && m.Usage !== Usage.None) continue;
    if (usages.inputs.includes(name)) {
      m.Usage = Usage.Input;
    } else if (usages.outputs.includes(name)) {
      m.Usage = Usage.Output;
    } else if (usages.roundTrips.includes(name)) {
      m.Usage = Usage.RoundTrip;
    } else {
      m.Usage = Usage.None;
    }
  }
}

function getRootApiVersions(clients: SdkClientType<SdkHttpOperation>[]): string[] {
  // find any root client since they should have the same api versions
  const oneRootClient = clients.find((c) => c.initialization.access === "public");
  if (!oneRootClient) throw new Error("Root client not found");

  return oneRootClient.apiVersions;
}

function getMethodUri(p: SdkEndpointParameter | undefined): string {
  if (!p) return "";

  if (p.type.templateArguments.length > 0) return p.type.serverUrl;

  return `{${p.name}}`;
}
