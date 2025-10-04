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
import { InputParameterScope } from "../type/input-parameter-scope.js";
import { InputClient, InputEndpointParameter, InputType } from "../type/input-type.js";
import { fromSdkServiceMethod, getParameterDefaultValue } from "./operation-converter.js";
import { fromSdkType } from "./type-converter.js";
import { isReadOnly } from "./utils.js";

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
    methods: client.methods
      .map((m) => fromSdkServiceMethod(sdkContext, m, uri, rootApiVersions, client.namespace))
      .filter((m) => m !== undefined),
    parameters: clientParameters,
    decorators: client.decorators,
    crossLanguageDefinitionId: client.crossLanguageDefinitionId,
    apiVersions: client.apiVersions,
    parent: undefined,
    children: undefined,
  };

  sdkContext.__typeCache.updateSdkClientReferences(client, inputClient);

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

  function fromSdkEndpointParameter(p: SdkEndpointParameter): InputEndpointParameter[] {
    if (p.type.kind === "union") {
      return fromSdkEndpointType(p.type.variantTypes[0]);
    } else {
      return fromSdkEndpointType(p.type);
    }
  }

  function fromSdkEndpointType(type: SdkEndpointType): InputEndpointParameter[] {
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

    const parameters: InputEndpointParameter[] = [];
    for (const parameter of type.templateArguments) {
      const isEndpoint = parameter.name === endpointVariableName;
      const parameterType: InputType = isEndpoint
        ? {
            kind: parameter.type.kind === "string" ? "string" : "url",
            name: "endpoint",
            crossLanguageDefinitionId:
              parameter.type.kind === "string" ? "TypeSpec.string" : "TypeSpec.url",
          }
        : fromSdkType(sdkContext, parameter.type); // TODO: consolidate with converter.fromSdkEndpointType
      parameters.push({
        kind: "endpoint",
        name: parameter.name,
        serializedName: parameter.serializedName,
        summary: parameter.summary,
        doc: parameter.doc,
        type: parameterType,
        isApiVersion: parameter.isApiVersionParam,
        optional: parameter.optional,
        scope: InputParameterScope.Client,
        isEndpoint: isEndpoint,
        defaultValue: getParameterDefaultValue(
          sdkContext,
          parameter.clientDefaultValue,
          parameterType,
        ),
        serverUrlTemplate: type.serverUrl,
        skipUrlEncoding: false,
        readOnly: isReadOnly(parameter),
        crossLanguageDefinitionId: parameter.crossLanguageDefinitionId,
      });
    }
    return parameters;
  }
}

function getMethodUri(p: SdkEndpointParameter | undefined): string {
  if (!p) return "";

  if (p.type.kind === "endpoint" && p.type.templateArguments.length > 0) return p.type.serverUrl;

  if (p.type.kind === "union" && p.type.variantTypes.length > 0)
    return (p.type.variantTypes[0] as SdkEndpointType).serverUrl;

  return `{${p.name}}`;
}
