// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType as SdkClientTypeOfT,
  SdkEndpointParameter,
  SdkEndpointType,
  SdkHttpOperation,
} from "@azure-tools/typespec-client-generator-core";
import { NoTarget } from "@typespec/compiler";
import { CSharpEmitterContext } from "../sdk-context.js";
import { InputOperationParameterKind } from "../type/input-operation-parameter-kind.js";
import { InputParameter } from "../type/input-parameter.js";
import { InputClient, InputType } from "../type/input-type.js";
import { RequestLocation } from "../type/request-location.js";
import { fromSdkServiceMethod, getParameterDefaultValue } from "./operation-converter.js";
import { fromSdkType } from "./type-converter.js";

type SdkClientType = SdkClientTypeOfT<SdkHttpOperation>;

export function fromSdkClients(
  sdkContext: CSharpEmitterContext,
  clients: SdkClientType[],
  rootApiVersions: string[],
): InputClient[] {
  const inputClients: InputClient[] = [];
  for (const client of clients) {
    const inputClient = fromSdkClient(sdkContext, client, rootApiVersions);
    inputClients.push(inputClient);
  }

  return inputClients;
}

function fromSdkClient(
  sdkContext: CSharpEmitterContext,
  client: SdkClientType,
  rootApiVersions: string[],
): InputClient {
  let inputClient: InputClient | undefined = sdkContext.__typeCache.clients.get(client);
  if (inputClient) {
    return inputClient;
  }
  const endpointParameter = client.clientInitialization.parameters.find(
    (p) => p.kind === "endpoint",
  ) as SdkEndpointParameter;
  const uri = getMethodUri(endpointParameter);
  const clientParameters = fromSdkEndpointParameter(endpointParameter);

  inputClient = {
    kind: "client",
    name: client.name,
    namespace: client.namespace,
    doc: client.doc,
    summary: client.summary,
    operations: client.methods.map((m) =>
      fromSdkServiceMethod(sdkContext, m, uri, rootApiVersions),
    ),
    parameters: clientParameters,
    decorators: client.decorators,
    crossLanguageDefinitionId: client.crossLanguageDefinitionId,
    apiVersions: client.apiVersions,
    parent: undefined,
    children: undefined,
  };

  updateSdkClientTypeReferences(sdkContext, client, inputClient);

  // fill parent
  if (client.parent) {
    inputClient.parent = fromSdkClient(sdkContext, client.parent, rootApiVersions);
  }
  // fill children
  if (client.children) {
    inputClient.children = client.children.map((c) =>
      fromSdkClient(sdkContext, c, rootApiVersions),
    );
  }

  return inputClient;

  function fromSdkEndpointParameter(p: SdkEndpointParameter): InputParameter[] {
    if (p.type.kind === "union") {
      return fromSdkEndpointType(p.type.variantTypes[0]);
    } else {
      return fromSdkEndpointType(p.type);
    }
  }

  function fromSdkEndpointType(type: SdkEndpointType): InputParameter[] {
    // TODO: support free-style endpoint url with multiple parameters
    const endpointExpr = type.serverUrl
      .replace("https://", "")
      .replace("http://", "")
      .split("/")[0];
    if (!/^\{\w+\}$/.test(endpointExpr)) {
      sdkContext.logger.reportDiagnostic({
        code: "unsupported-endpoint-url",
        format: { endpoint: type.serverUrl },
        target: NoTarget,
      });
      return [];
    }
    const endpointVariableName = endpointExpr.substring(1, endpointExpr.length - 1);

    const parameters: InputParameter[] = [];
    for (const parameter of type.templateArguments) {
      const isEndpoint = parameter.name === endpointVariableName;
      const parameterType: InputType = isEndpoint
        ? {
            kind: "url",
            name: "url",
            crossLanguageDefinitionId: "TypeSpec.url",
          }
        : fromSdkType(sdkContext, parameter.type); // TODO: consolidate with converter.fromSdkEndpointType
      parameters.push({
        name: parameter.name,
        nameInRequest: parameter.serializedName,
        summary: parameter.summary,
        doc: parameter.doc,
        type: parameterType,
        location: RequestLocation.Uri,
        isApiVersion: parameter.isApiVersionParam,
        isContentType: false,
        isRequired: !parameter.optional,
        isEndpoint: isEndpoint,
        skipUrlEncoding: false,
        explode: false,
        kind: InputOperationParameterKind.Client,
        defaultValue: getParameterDefaultValue(
          sdkContext,
          parameter.clientDefaultValue,
          parameterType,
        ),
      });
    }
    return parameters;
  }
}

function updateSdkClientTypeReferences(
  sdkContext: CSharpEmitterContext,
  sdkClient: SdkClientType,
  inputClient: InputClient,
) {
  sdkContext.__typeCache.clients.set(sdkClient, inputClient);
  sdkContext.__typeCache.crossLanguageDefinitionIds.set(
    sdkClient.crossLanguageDefinitionId,
    sdkClient.__raw.type,
  );
}

function getMethodUri(p: SdkEndpointParameter | undefined): string {
  if (!p) return "";

  if (p.type.kind === "endpoint" && p.type.templateArguments.length > 0) return p.type.serverUrl;

  if (p.type.kind === "union" && p.type.variantTypes.length > 0)
    return (p.type.variantTypes[0] as SdkEndpointType).serverUrl;

  return `{${p.name}}`;
}
