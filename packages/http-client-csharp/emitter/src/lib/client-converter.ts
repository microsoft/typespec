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
import { createDiagnosticCollector, Diagnostic, NoTarget } from "@typespec/compiler";
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
): [InputClient[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const inputClients: InputClient[] = [];
  for (const client of clients) {
    const inputClient = diagnostics.pipe(fromSdkClient(sdkContext, client, rootApiVersions));
    inputClients.push(inputClient);
  }

  return diagnostics.wrap(inputClients);
}

function fromSdkClient(
  sdkContext: CSharpEmitterContext,
  client: SdkClientType,
  rootApiVersions: string[],
): [InputClient, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let inputClient: InputClient | undefined = sdkContext.__typeCache.clients.get(client);
  if (inputClient) {
    return diagnostics.wrap(inputClient);
  }
  const endpointParameter = client.clientInitialization.parameters.find(
    (p) => p.kind === "endpoint",
  ) as SdkEndpointParameter;
  const uri = getMethodUri(endpointParameter);

  // Convert all clientInitialization parameters
  const clientParameters = diagnostics.pipe(fromSdkClientInitializationParameters(
    sdkContext,
    client.clientInitialization.parameters,
    client.namespace,
  ));

  const isMultiService = isMultiServiceClient(client);
  const clientName =
    !client.parent && isMultiService && !client.name.toLowerCase().endsWith("client")
      ? `${client.name}Client`
      : client.name;

  inputClient = {
    kind: "client",
    name: clientName,
    namespace: client.namespace,
    doc: client.doc,
    summary: client.summary,
    methods: client.methods
      .map((m) => diagnostics.pipe(fromSdkServiceMethod(sdkContext, m, uri, rootApiVersions, client.namespace)))
      .filter((m) => m !== undefined),
    parameters: clientParameters,
    initializedBy: client.clientInitialization.initializedBy,
    decorators: client.decorators,
    crossLanguageDefinitionId: client.crossLanguageDefinitionId,
    apiVersions: client.apiVersions,
    parent: undefined,
    children: undefined,
    isMultiServiceClient: isMultiService,
  };

  sdkContext.__typeCache.updateSdkClientReferences(client, inputClient);

  // fill parent
  if (client.parent) {
    inputClient.parent = diagnostics.pipe(fromSdkClient(sdkContext, client.parent, rootApiVersions));
  }
  // fill children
  if (client.children) {
    inputClient.children = client.children.map((c) =>
      diagnostics.pipe(fromSdkClient(sdkContext, c, rootApiVersions)),
    );
  }

  return diagnostics.wrap(inputClient);

  function fromSdkClientInitializationParameters(
    sdkContext: CSharpEmitterContext,
    parameters: (SdkEndpointParameter | SdkCredentialParameter | SdkMethodParameter)[],
    namespace: string,
  ): [InputParameter[], readonly Diagnostic[]] {
    const diagnostics = createDiagnosticCollector();
    const inputParameters: InputParameter[] = [];

    for (const param of parameters) {
      if (param.kind === "endpoint") {
        // Convert endpoint parameters
        const endpointParams = diagnostics.pipe(fromSdkEndpointParameter(param));
        inputParameters.push(...endpointParams);
      } else if (param.kind === "method") {
        // Convert method parameters
        const methodParam = diagnostics.pipe(fromMethodParameter(sdkContext, param, namespace));
        inputParameters.push(methodParam);
      }
      // Note: credential parameters are handled separately in service-authentication.ts
      // and are not included in the client parameters list
    }

    return diagnostics.wrap(inputParameters);
  }

  function fromSdkEndpointParameter(p: SdkEndpointParameter): [InputEndpointParameter[], readonly Diagnostic[]] {
    const diagnostics = createDiagnosticCollector();
    if (p.type.kind === "union") {
      return diagnostics.wrap(diagnostics.pipe(fromSdkEndpointType(p.type.variantTypes[0])));
    } else {
      return diagnostics.wrap(diagnostics.pipe(fromSdkEndpointType(p.type)));
    }
  }

  function fromSdkEndpointType(type: SdkEndpointType): [InputEndpointParameter[], readonly Diagnostic[]] {
    const diagnostics = createDiagnosticCollector();
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
      return diagnostics.wrap([]);
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
        : diagnostics.pipe(fromSdkType(sdkContext, parameter.type)); // TODO: consolidate with converter.fromSdkEndpointType
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
        defaultValue: diagnostics.pipe(getParameterDefaultValue(
          sdkContext,
          parameter.clientDefaultValue,
          parameterType,
        )),
        serverUrlTemplate: type.serverUrl,
        skipUrlEncoding: false,
        readOnly: isReadOnly(parameter),
        crossLanguageDefinitionId: parameter.crossLanguageDefinitionId,
      });
    }
    return diagnostics.wrap(parameters);
  }
}

function getMethodUri(p: SdkEndpointParameter | undefined): string {
  if (!p) return "";

  if (p.type.kind === "endpoint" && p.type.templateArguments.length > 0) return p.type.serverUrl;

  if (p.type.kind === "union" && p.type.variantTypes.length > 0)
    return (p.type.variantTypes[0] as SdkEndpointType).serverUrl;

  return `{${p.name}}`;
}
