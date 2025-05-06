import {
  SdkBasicServiceMethod,
  SdkClientType,
  SdkCredentialParameter,
  SdkCredentialType,
  SdkEndpointParameter,
  SdkEndpointType,
  SdkLroPagingServiceMethod,
  SdkLroServiceMethod,
  SdkMethodParameter,
  SdkPagingServiceMethod,
  SdkServiceMethod,
  SdkServiceOperation,
  SdkUnionType,
  UsageFlags,
  getCrossLanguagePackageId,
  isAzureCoreModel,
} from "@azure-tools/typespec-client-generator-core";
import { ignoreDiagnostics } from "@typespec/compiler";
import {
  emitBasicHttpMethod,
  emitLroHttpMethod,
  emitLroPagingHttpMethod,
  emitPagingHttpMethod,
} from "./http.js";
import { PythonSdkContext } from "./lib.js";
import {
  KnownTypes,
  disableGenerationMap,
  emitEndpointType,
  getType,
  simpleTypesMap,
  typesMap,
} from "./types.js";
import { emitParamBase, getClientNamespace, getImplementation, getRootNamespace } from "./utils.js";

function emitBasicMethod<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext,
  rootClient: SdkClientType<TServiceOperation>,
  method: SdkBasicServiceMethod<TServiceOperation>,
  operationGroupName: string,
): Record<string, any>[] {
  if (method.operation.kind !== "http")
    throw new Error("We only support HTTP operations right now");
  switch (method.operation.kind) {
    case "http":
      return emitBasicHttpMethod(context, rootClient, method, operationGroupName);
    default:
      throw new Error("We only support HTTP operations right now");
  }
}

function emitLroMethod<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext,
  rootClient: SdkClientType<TServiceOperation>,
  method: SdkLroServiceMethod<TServiceOperation>,
  operationGroupName: string,
): Record<string, any>[] {
  if (method.operation.kind !== "http")
    throw new Error("We only support HTTP operations right now");
  switch (method.operation.kind) {
    case "http":
      return emitLroHttpMethod(context, rootClient, method, operationGroupName);
    default:
      throw new Error("We only support HTTP operations right now");
  }
}

function emitPagingMethod<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext,
  rootClient: SdkClientType<TServiceOperation>,
  method: SdkPagingServiceMethod<TServiceOperation>,
  operationGroupName: string,
): Record<string, any>[] {
  if (method.operation.kind !== "http")
    throw new Error("We only support HTTP operations right now");
  switch (method.operation.kind) {
    case "http":
      return emitPagingHttpMethod(context, rootClient, method, operationGroupName);
    default:
      throw new Error("We only support HTTP operations right now");
  }
}

function emitLroPagingMethod<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext,
  rootClient: SdkClientType<TServiceOperation>,
  method: SdkLroPagingServiceMethod<TServiceOperation>,
  operationGroupName: string,
): Record<string, any>[] {
  if (method.operation.kind !== "http")
    throw new Error("We only support HTTP operations right now");
  switch (method.operation.kind) {
    case "http":
      return emitLroPagingHttpMethod(context, rootClient, method, operationGroupName);
    default:
      throw new Error("We only support HTTP operations right now");
  }
}

function emitMethodParameter(
  context: PythonSdkContext,
  parameter: SdkEndpointParameter | SdkCredentialParameter | SdkMethodParameter,
): Record<string, any>[] {
  if (parameter.kind === "endpoint") {
    if (parameter.type.kind === "union") {
      for (const endpointVal of parameter.type.variantTypes) {
        return emitEndpointType(context, endpointVal as SdkEndpointType);
      }
    } else {
      return emitEndpointType(context, parameter.type);
    }
  }
  // filter out credential that python does not support for now
  if (parameter.kind === "credential") {
    const filteredCredentialType = [];
    const originalCredentialType =
      parameter.type.kind === "union" ? parameter.type.variantTypes : [parameter.type];
    for (const credentialType of originalCredentialType) {
      if (
        credentialType.scheme.type === "oauth2" ||
        credentialType.scheme.type === "http" ||
        (credentialType.scheme.type === "apiKey" && credentialType.scheme.in === "header")
      ) {
        filteredCredentialType.push(credentialType);
      }
    }
    if (filteredCredentialType.length === 0) {
      return [];
    } else if (filteredCredentialType.length === 1) {
      parameter.type = filteredCredentialType[0];
    } else {
      (parameter.type as SdkUnionType<SdkCredentialType>).variantTypes = filteredCredentialType;
    }
  }
  const base = {
    ...emitParamBase(context, parameter),
    implementation: getImplementation(context, parameter),
    clientDefaultValue: parameter.clientDefaultValue,
    location: parameter.kind,
  };
  if (parameter.isApiVersionParam) {
    return [
      {
        ...base,
        location: "query",
        wireName: "api-version",
        in_docstring: false,
      },
    ];
  }
  return [base];
}

function emitMethod<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext,
  rootClient: SdkClientType<TServiceOperation>,
  method: SdkServiceMethod<TServiceOperation>,
  operationGroupName: string,
): Record<string, any>[] {
  switch (method.kind) {
    case "basic":
      return emitBasicMethod(context, rootClient, method, operationGroupName);
    case "lro":
      return emitLroMethod(context, rootClient, method, operationGroupName);
    case "paging":
      return emitPagingMethod(context, rootClient, method, operationGroupName);
    default:
      return emitLroPagingMethod(context, rootClient, method, operationGroupName);
  }
}

function emitOperationGroups<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext,
  client: SdkClientType<TServiceOperation>,
  rootClient: SdkClientType<TServiceOperation>,
  prefix: string,
): Record<string, any>[] | undefined {
  const operationGroups: Record<string, any>[] = [];

  for (const operationGroup of client.children ?? []) {
    const name = `${prefix}${operationGroup.name}`;
    let operations: Record<string, any>[] = [];
    for (const method of operationGroup.methods) {
      operations = operations.concat(emitMethod(context, rootClient, method, name));
    }
    operationGroups.push({
      name: name,
      className: name,
      propertyName: operationGroup.name,
      operations: operations,
      operationGroups: emitOperationGroups(context, operationGroup, rootClient, name),
      clientNamespace: getClientNamespace(context, operationGroup.namespace),
    });
  }

  // root client should deal with mixin operation group
  if (prefix === "") {
    let operations: Record<string, any>[] = [];
    for (const method of client.methods) {
      operations = operations.concat(emitMethod(context, rootClient, method, ""));
    }
    if (operations.length > 0) {
      operationGroups.push({
        name: "",
        className: "",
        propertyName: "",
        operations: operations,
        clientNamespace: getClientNamespace(context, client.namespace),
      });
    }
  }

  // operation has same clientNamespace as the operation group
  for (const og of operationGroups) {
    for (const op of og.operations) {
      op.clientNamespace = getClientNamespace(context, og.clientNamespace);
    }
  }

  return operationGroups.length > 0 ? operationGroups : undefined;
}

function emitClient<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext,
  client: SdkClientType<TServiceOperation>,
): Record<string, any> {
  if (client.clientInitialization) {
    context.__endpointPathParameters = [];
  }
  const parameters =
    client.clientInitialization?.parameters
      .map((x) => emitMethodParameter(context, x))
      .reduce((a, b) => [...a, ...b]) ?? [];

  const endpointParameter = client.clientInitialization?.parameters.find(
    (x) => x.kind === "endpoint",
  ) as SdkEndpointParameter | undefined;
  const operationGroups = emitOperationGroups(context, client, client, "");
  let url: string | undefined;
  if (endpointParameter?.type.kind === "union") {
    url = (endpointParameter.type.variantTypes[0] as SdkEndpointType).serverUrl;
  } else {
    url = endpointParameter?.type.serverUrl;
  }
  return {
    name: client.name,
    description: (client.summary ? client.summary : client.doc) ?? "",
    parameters,
    operationGroups,
    url,
    apiVersions: client.apiVersions,
    arm: context.arm,
    clientNamespace: getClientNamespace(context, client.namespace),
  };
}

function onlyUsedByPolling(usage: UsageFlags): boolean {
  return (
    ((usage & UsageFlags.LroInitial) > 0 ||
      (usage & UsageFlags.LroFinalEnvelope) > 0 ||
      (usage & UsageFlags.LroPolling) > 0) &&
    (usage & UsageFlags.Input) === 0 &&
    (usage & UsageFlags.Output) === 0
  );
}

export function emitCodeModel(sdkContext: PythonSdkContext) {
  // Get types
  const sdkPackage = sdkContext.sdkPackage;
  const codeModel: Record<string, any> = {
    namespace: getRootNamespace(sdkContext),
    clients: [],
  };
  if (sdkPackage.licenseInfo) {
    codeModel["licenseInfo"] = sdkPackage.licenseInfo;
  }
  for (const client of sdkPackage.clients) {
    codeModel["clients"].push(emitClient(sdkContext, client));
  }
  // loop through models and enums since there may be some orphaned models needs to be generated
  for (const model of sdkPackage.models) {
    // filter out spread models
    if (
      model.name === "" ||
      ((model.usage & UsageFlags.Spread) > 0 &&
        (model.usage & UsageFlags.Input) === 0 &&
        (model.usage & UsageFlags.Output) === 0)
    ) {
      continue;
    }
    // filter out models only used for polling and or envelope result
    if (onlyUsedByPolling(model.usage)) {
      continue;
    }
    // filter out specific models not used in python, e.g., pageable models
    if (disableGenerationMap.has(model)) {
      continue;
    }
    // filter out core models
    if (isAzureCoreModel(model)) {
      continue;
    }
    getType(sdkContext, model);
  }
  for (const sdkEnum of sdkPackage.enums) {
    // filter out api version enum since python do not generate it
    if (sdkEnum.usage === UsageFlags.ApiVersionEnum) {
      continue;
    }
    if (onlyUsedByPolling(sdkEnum.usage)) {
      continue;
    }
    // filter out core enums
    if (isAzureCoreModel(sdkEnum)) {
      continue;
    }
    getType(sdkContext, sdkEnum);
  }
  codeModel["types"] = [
    ...typesMap.values(),
    ...Object.values(KnownTypes),
    ...simpleTypesMap.values(),
  ];
  codeModel["crossLanguagePackageId"] = ignoreDiagnostics(getCrossLanguagePackageId(sdkContext));
  return codeModel;
}
