// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType as SdkClientTypeOfT,
  SdkCredentialParameter,
  SdkEndpointParameter,
  SdkEndpointType,
  SdkHttpOperation,
  SdkMethodParameter,
} from "@azure-tools/typespec-client-generator-core";
import { DiagnosticCollector, NoTarget } from "@typespec/compiler";
import { CSharpEmitterContext } from "../sdk-context.js";
import { createDiagnostic } from "./lib.js";
import { InputParameterScope } from "../type/input-parameter-scope.js";
import {
  InputClient,
  InputEndpointParameter,
  InputParameter,
  InputType,
} from "../type/input-type.js";
import {
  fromMethodParameter,
  fromSdkServiceMethod,
  getParameterDefaultValue,
} from "./operation-converter.js";
import { fromSdkType } from "./type-converter.js";
import { isMultiServiceClient, isReadOnly } from "./utils.js";

type SdkClientType = SdkClientTypeOfT<SdkHttpOperation>;

export function fromSdkClients(
  sdkContext: CSharpEmitterContext,
  clients: SdkClientType[],
  rootApiVersions: string[],
  diagnostics: DiagnosticCollector,
): InputClient[] {
  const inputClients: InputClient[] = [];
  for (const client of clients) {
    const inputClient = fromSdkClient(sdkContext, client, rootApiVersions, diagnostics);
    inputClients.push(inputClient);
  }

  return inputClients;
}

function fromSdkClient(
  sdkContext: CSharpEmitterContext,
  client: SdkClientType,
  rootApiVersions: string[],
  diagnostics: DiagnosticCollector,
): InputClient {
  let inputClient: InputClient | undefined = sdkContext.__typeCache.clients.get(client);
  if (inputClient) {
    return inputClient;
  }
  const endpointParameter = client.clientInitialization.parameters.find(
    (p) => p.kind === "endpoint",
  ) as SdkEndpointParameter;
  const uri = getMethodUri(endpointParameter);

  // Convert all clientInitialization parameters
  const clientParameters = fromSdkClientInitializationParameters(
    sdkContext,
    client.clientInitialization.parameters,
    client.namespace,
    diagnostics,
  );

  inputClient = {
    kind: "client",
    name: client.name,
    namespace: client.namespace,
    doc: client.doc,
    summary: client.summary,
    methods: client.methods
      .map((m) => fromSdkServiceMethod(sdkContext, m, uri, rootApiVersions, client.namespace, diagnostics))
      .filter((m) => m !== undefined),
    parameters: clientParameters,
    initializedBy: client.clientInitialization.initializedBy,
    decorators: client.decorators,
    crossLanguageDefinitionId: client.crossLanguageDefinitionId,
    apiVersions: client.apiVersions,
    parent: undefined,
    children: undefined,
    isMultiServiceClient: isMultiServiceClient(client),
  };

  sdkContext.__typeCache.updateSdkClientReferences(client, inputClient);

  // fill parent
  if (client.parent) {
    inputClient.parent = fromSdkClient(sdkContext, client.parent, rootApiVersions, diagnostics);
  }
  // fill children
  if (client.children) {
    inputClient.children = client.children.map((c) =>
      fromSdkClient(sdkContext, c, rootApiVersions, diagnostics),
    );
  }

  return inputClient;

  function fromSdkClientInitializationParameters(
    sdkContext: CSharpEmitterContext,
    parameters: (SdkEndpointParameter | SdkCredentialParameter | SdkMethodParameter)[],
    namespace: string,
    diagnostics: DiagnosticCollector,
  ): InputParameter[] {
    const inputParameters: InputParameter[] = [];

    for (const param of parameters) {
      if (param.kind === "endpoint") {
        // Convert endpoint parameters
        const endpointParams = fromSdkEndpointParameter(param, diagnostics);
        inputParameters.push(...endpointParams);
      } else if (param.kind === "method") {
        // Convert method parameters
        const methodParam = fromMethodParameter(sdkContext, param, namespace, diagnostics);
        inputParameters.push(methodParam);
      }
      // Note: credential parameters are handled separately in service-authentication.ts
      // and are not included in the client parameters list
    }

    return inputParameters;
  }

  function fromSdkEndpointParameter(p: SdkEndpointParameter, diagnostics: DiagnosticCollector): InputEndpointParameter[] {
    if (p.type.kind === "union") {
      return fromSdkEndpointType(p.type.variantTypes[0], diagnostics);
    } else {
      return fromSdkEndpointType(p.type, diagnostics);
    }
  }

  function fromSdkEndpointType(type: SdkEndpointType, diagnostics: DiagnosticCollector): InputEndpointParameter[] {
    // TODO: support free-style endpoint url with multiple parameters
    const endpointExpr = type.serverUrl
      .replace("https://", "")
      .replace("http://", "")
      .split("/")[0];
    if (!/^\{\w+\}$/.test(endpointExpr)) {
      diagnostics.add(
        createDiagnostic({
          code: "unsupported-endpoint-url",
          format: { endpoint: type.serverUrl },
          target: NoTarget,
        }),
      );
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
        : fromSdkType(sdkContext, parameter.type, diagnostics); // TODO: consolidate with converter.fromSdkEndpointType
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
          diagnostics,
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
