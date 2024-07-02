// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClient,
  SdkContext,
  SdkOperationGroup,
  getAllModels,
  getLibraryName,
  listClients,
  listOperationGroups,
  listOperationsInOperationGroup,
} from "@azure-tools/typespec-client-generator-core";
import {
  EmitContext,
  NoTarget,
  Service,
  getDoc,
  getNamespaceFullName,
  ignoreDiagnostics,
  listServices,
} from "@typespec/compiler";
import {
  HttpOperation,
  getAllHttpServices,
  getAuthentication,
  getHttpOperation,
  getServers,
} from "@typespec/http";
import { getVersions } from "@typespec/versioning";
import { NetEmitterOptions, resolveOptions } from "../options.js";
import { ClientKind } from "../type/client-kind.js";
import { CodeModel } from "../type/code-model.js";
import { InputClient } from "../type/input-client.js";
import { InputConstant } from "../type/input-constant.js";
import { InputOperationParameterKind } from "../type/input-operation-parameter-kind.js";
import { InputOperation } from "../type/input-operation.js";
import { InputParameter } from "../type/input-parameter.js";
import { InputEnumType, InputModelType, InputPrimitiveType } from "../type/input-type.js";
import { RequestLocation } from "../type/request-location.js";
import { Usage } from "../type/usage.js";
import { reportDiagnostic } from "./lib.js";
import { Logger } from "./logger.js";
import { getUsages, navigateModels } from "./model.js";
import { loadOperation } from "./operation.js";
import { processServiceAuthentication } from "./service-authentication.js";
import { resolveServers } from "./typespec-server.js";
import { createContentTypeOrAcceptParameter } from "./utils.js";

export function createModel(sdkContext: SdkContext<NetEmitterOptions>): CodeModel {
  // initialize tcgc model
  if (!sdkContext.operationModelsMap) getAllModels(sdkContext);

  const services = listServices(sdkContext.emitContext.program);
  if (services.length === 0) {
    services.push({
      type: sdkContext.emitContext.program.getGlobalNamespaceType(),
    });
  }

  // TODO: support multiple service. Current only chose the first service.
  const service = services[0];
  const serviceNamespaceType = service.type;
  if (serviceNamespaceType === undefined) {
    throw Error("Can not emit yaml for a namespace that doesn't exist.");
  }

  return createModelForService(sdkContext, service);
}

export function createModelForService(
  sdkContext: SdkContext<NetEmitterOptions>,
  service: Service
): CodeModel {
  const program = sdkContext.emitContext.program;
  const serviceNamespaceType = service.type;

  const apiVersions: Set<string> | undefined = new Set<string>();
  let defaultApiVersion: string | undefined = undefined;
  let versions = getVersions(program, service.type)[1]
    ?.getVersions()
    .map((v) => v.value);
  const targetApiVersion = sdkContext.emitContext.options["api-version"];
  if (
    versions !== undefined &&
    targetApiVersion !== undefined &&
    targetApiVersion !== "all" &&
    targetApiVersion !== "latest"
  ) {
    const targetApiVersionIndex = versions.findIndex((v) => v === targetApiVersion);
    versions = versions.slice(0, targetApiVersionIndex + 1);
  }
  if (versions && versions.length > 0) {
    for (const ver of versions) {
      apiVersions.add(ver);
    }
    defaultApiVersion = versions[versions.length - 1];
  }
  const defaultApiVersionConstant: InputConstant | undefined = defaultApiVersion
    ? {
        Type: {
          Kind: "string",
          IsNullable: false,
        } as InputPrimitiveType,
        Value: defaultApiVersion,
      }
    : undefined;

  const servers = getServers(program, serviceNamespaceType);
  const namespace = getNamespaceFullName(serviceNamespaceType) || "client";
  const authentication = getAuthentication(program, serviceNamespaceType);
  let auth = undefined;
  if (authentication) {
    auth = processServiceAuthentication(authentication);
  }

  const modelMap = new Map<string, InputModelType>();
  const enumMap = new Map<string, InputEnumType>();
  let urlParameters: InputParameter[] | undefined = undefined;
  let url: string = "";
  const convenienceOperations: HttpOperation[] = [];

  //create endpoint parameter from servers
  if (servers !== undefined) {
    const typespecServers = resolveServers(sdkContext, servers, modelMap, enumMap);
    if (typespecServers.length > 0) {
      /* choose the first server as endpoint. */
      url = typespecServers[0].url;
      urlParameters = typespecServers[0].parameters;
    }
  }
  const [services] = getAllHttpServices(program);
  const routes = services[0].operations;
  if (routes.length === 0) {
    reportDiagnostic(program, {
      code: "no-route",
      format: { service: services[0].namespace.name },
      target: NoTarget,
    });
  }
  Logger.getInstance().info("routes:" + routes.length);

  const clients: InputClient[] = [];
  const dpgClients = listClients(sdkContext);
  for (const client of dpgClients) {
    clients.push(emitClient(client));
    addChildClients(sdkContext.emitContext, client, clients);
  }

  navigateModels(sdkContext, modelMap, enumMap);

  const usages = getUsages(sdkContext, convenienceOperations, modelMap);
  setUsage(usages, modelMap);
  setUsage(usages, enumMap);

  for (const client of clients) {
    for (const op of client.Operations) {
      /* TODO: remove this when adopt tcgc.
       *set Multipart usage for models.
       */
      const bodyParameter = op.Parameters.find((value) => value.Location === RequestLocation.Body);
      if (bodyParameter && bodyParameter.Type && (bodyParameter.Type as InputModelType)) {
        const inputModelType = bodyParameter.Type as InputModelType;
        op.RequestMediaTypes?.forEach((item) => {
          if (item === "multipart/form-data" && !inputModelType.Usage.includes(Usage.Multipart)) {
            if (inputModelType.Usage.trim().length === 0) {
              inputModelType.Usage = inputModelType.Usage.concat(Usage.Multipart);
            } else {
              inputModelType.Usage = inputModelType.Usage.trim()
                .concat(",")
                .concat(Usage.Multipart);
            }
          }
        });
      }

      const apiVersionIndex = op.Parameters.findIndex(
        (value: InputParameter) => value.IsApiVersion
      );
      if (apiVersionIndex === -1) {
        continue;
      }
      const apiVersionInOperation = op.Parameters[apiVersionIndex];
      if (defaultApiVersionConstant !== undefined) {
        if (!apiVersionInOperation.DefaultValue?.Value) {
          apiVersionInOperation.DefaultValue = defaultApiVersionConstant;
        }
      } else {
        apiVersionInOperation.Kind = InputOperationParameterKind.Method;
      }
    }
  }

  const clientModel = {
    Name: namespace,
    ApiVersions: Array.from(apiVersions.values()),
    Enums: Array.from(enumMap.values()),
    Models: Array.from(modelMap.values()),
    Clients: clients,
    Auth: auth,
  } as CodeModel;
  return clientModel;

  function addChildClients(
    context: EmitContext<NetEmitterOptions>,
    client: SdkClient | SdkOperationGroup,
    clients: InputClient[]
  ) {
    const dpgOperationGroups = listOperationGroups(sdkContext, client as SdkClient);
    for (const dpgGroup of dpgOperationGroups) {
      const subClient = emitClient(dpgGroup, client);
      clients.push(subClient);
      addChildClients(context, dpgGroup, clients);
    }
  }

  function getClientName(client: SdkClient | SdkOperationGroup): string {
    if (client.kind === ClientKind.SdkClient) {
      return client.name;
    }

    const pathParts = client.groupPath.split(".");
    if (pathParts?.length >= 3) {
      return pathParts.slice(pathParts.length - 2).join("");
    }

    const clientName = getLibraryName(sdkContext, client.type);
    if (
      clientName === "Models" &&
      resolveOptions(sdkContext.emitContext)["model-namespace"] !== false
    ) {
      reportDiagnostic(program, {
        code: "invalid-name",
        format: { name: clientName },
        target: client.type,
      });
      return "ModelsOps";
    }
    return clientName;
  }

  function emitClient(
    client: SdkClient | SdkOperationGroup,
    parent?: SdkClient | SdkOperationGroup
  ): InputClient {
    const operations = listOperationsInOperationGroup(sdkContext, client);
    let clientDesc = "";
    if (operations.length > 0) {
      const container = ignoreDiagnostics(getHttpOperation(program, operations[0])).container;
      clientDesc = getDoc(program, container) ?? "";
    }

    const inputClient = {
      Name: getClientName(client),
      Description: clientDesc,
      Operations: [],
      Protocol: {},
      Creatable: client.kind === ClientKind.SdkClient,
      Parent: parent === undefined ? undefined : getClientName(parent),
      Parameters: urlParameters,
    } as InputClient;
    for (const op of operations) {
      const httpOperation = ignoreDiagnostics(getHttpOperation(program, op));
      const inputOperation: InputOperation = loadOperation(
        sdkContext,
        httpOperation,
        url,
        urlParameters,
        serviceNamespaceType,
        modelMap,
        enumMap
      );

      applyDefaultContentTypeAndAcceptParameter(inputOperation);
      inputClient.Operations.push(inputOperation);
      if (inputOperation.GenerateConvenienceMethod) convenienceOperations.push(httpOperation);
    }
    return inputClient;
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

function applyDefaultContentTypeAndAcceptParameter(operation: InputOperation): void {
  const defaultValue: string = "application/json";
  if (
    operation.Parameters.some((value) => value.Location === RequestLocation.Body) &&
    !operation.Parameters.some((value) => value.IsContentType === true)
  ) {
    operation.Parameters.push(
      createContentTypeOrAcceptParameter([defaultValue], "contentType", "Content-Type")
    );
    operation.RequestMediaTypes = [defaultValue];
  }

  if (
    !operation.Parameters.some(
      (value) =>
        value.Location === RequestLocation.Header && value.NameInRequest.toLowerCase() === "accept"
    )
  ) {
    operation.Parameters.push(
      createContentTypeOrAcceptParameter([defaultValue], "accept", "Accept")
    );
  }
}
