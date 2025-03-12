// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType,
  SdkEndpointParameter,
  SdkEndpointType,
  SdkHttpOperation,
  SdkServiceMethod,
  UsageFlags,
} from "@azure-tools/typespec-client-generator-core";
import { NoTarget } from "@typespec/compiler";
import { CSharpEmitterContext } from "../sdk-context.js";
import { CodeModel } from "../type/code-model.js";
import { InputClient } from "../type/input-client.js";
import { InputOperationParameterKind } from "../type/input-operation-parameter-kind.js";
import { InputParameter } from "../type/input-parameter.js";
import { InputType } from "../type/input-type.js";
import { RequestLocation } from "../type/request-location.js";
import { navigateModels } from "./model.js";
import { fromSdkServiceMethod, getParameterDefaultValue } from "./operation-converter.js";
import { processServiceAuthentication } from "./service-authentication.js";
import { fromSdkType } from "./type-converter.js";

/**
 * Creates the code model from the SDK context.
 * @param sdkContext - The SDK context
 * @returns The code model
 * @beta
 */
export function createModel(sdkContext: CSharpEmitterContext): CodeModel {
  const sdkPackage = sdkContext.sdkPackage;

  navigateModels(sdkContext);

  const sdkApiVersionEnums = sdkPackage.enums.filter((e) => e.usage === UsageFlags.ApiVersionEnum);

  const rootClients = sdkPackage.clients.filter((c) => c.initialization.access === "public");
  if (rootClients.length === 0) {
    sdkContext.logger.reportDiagnostic({
      code: "no-root-client",
      format: {},
      target: NoTarget,
    });
    return {} as CodeModel;
  }

  const rootApiVersions =
    sdkApiVersionEnums.length > 0
      ? sdkApiVersionEnums[0].values.map((v) => v.value as string).flat()
      : rootClients[0].apiVersions;

  const inputClients: InputClient[] = [];
  fromSdkClients(rootClients, inputClients, []);

  const clientModel: CodeModel = {
    // rootNamespace is really coalescing the `package-name` option and the first namespace found.
    name: sdkPackage.rootNamespace,
    apiVersions: rootApiVersions,
    enums: Array.from(sdkContext.__typeCache.enums.values()),
    models: Array.from(sdkContext.__typeCache.models.values()),
    clients: inputClients,
    auth: processServiceAuthentication(sdkContext, sdkPackage),
  };

  return clientModel;

  function fromSdkClients(
    clients: SdkClientType<SdkHttpOperation>[],
    inputClients: InputClient[],
    parentClientNames: string[],
  ) {
    for (const client of clients) {
      const inputClient = fromSdkClient(client, parentClientNames);
      inputClients.push(inputClient);
      const subClients = client.methods
        .filter((m) => m.kind === "clientaccessor")
        .map((m) => m.response as SdkClientType<SdkHttpOperation>);
      parentClientNames.push(inputClient.name);
      fromSdkClients(subClients, inputClients, parentClientNames);
      parentClientNames.pop();
    }
  }

  function fromSdkClient(
    client: SdkClientType<SdkHttpOperation>,
    parentNames: string[],
  ): InputClient {
    const endpointParameter = client.initialization.properties.find(
      (p) => p.kind === "endpoint",
    ) as SdkEndpointParameter;
    const uri = getMethodUri(endpointParameter);
    const clientParameters = fromSdkEndpointParameter(endpointParameter);
    const clientName = getClientName(client, parentNames);

    sdkContext.__typeCache.crossLanguageDefinitionIds.set(
      client.crossLanguageDefinitionId,
      client.__raw.type,
    );
    return {
      name: clientName,
      namespace: client.namespace,
      summary: client.summary,
      doc: client.doc,
      operations: client.methods
        .filter((m) => m.kind !== "clientaccessor")
        .map((m) =>
          fromSdkServiceMethod(
            sdkContext,
            m as SdkServiceMethod<SdkHttpOperation>,
            uri,
            rootApiVersions,
          ),
        ),
      parent: parentNames.length > 0 ? parentNames[parentNames.length - 1] : undefined,
      parameters: clientParameters,
      decorators: client.decorators,
      crossLanguageDefinitionId: client.crossLanguageDefinitionId,
    };
  }

  function getClientName(
    client: SdkClientType<SdkHttpOperation>,
    parentClientNames: string[],
  ): string {
    const clientName = client.name;

    if (parentClientNames.length === 0) return clientName;
    if (parentClientNames.length >= 2)
      return `${parentClientNames.slice(parentClientNames.length - 1).join("")}${clientName}`;

    return clientName;
  }

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
        // TODO: we should do the magic in generator
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

function getMethodUri(p: SdkEndpointParameter | undefined): string {
  if (!p) return "";

  if (p.type.kind === "endpoint" && p.type.templateArguments.length > 0) return p.type.serverUrl;

  if (p.type.kind === "union" && p.type.variantTypes.length > 0)
    return (p.type.variantTypes[0] as SdkEndpointType).serverUrl;

  return `{${p.name}}`;
}
