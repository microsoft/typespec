import {
  SdkBasicServiceMethod,
  SdkClientType,
  SdkCredentialParameter,
  SdkEndpointParameter,
  SdkEndpointType,
  SdkLroPagingServiceMethod,
  SdkLroServiceMethod,
  SdkMethodParameter,
  SdkPagingServiceMethod,
  SdkServiceMethod,
  SdkServiceOperation,
  UsageFlags,
  getCrossLanguagePackageId,
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
import { emitParamBase, getImplementation, removeUnderscoresFromNamespace } from "./utils.js";

function emitBasicMethod<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
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
  context: PythonSdkContext<TServiceOperation>,
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
  context: PythonSdkContext<TServiceOperation>,
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
  context: PythonSdkContext<TServiceOperation>,
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

function emitMethodParameter<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
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
  context: PythonSdkContext<TServiceOperation>,
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
  context: PythonSdkContext<TServiceOperation>,
  client: SdkClientType<TServiceOperation>,
  rootClient: SdkClientType<TServiceOperation>,
  prefix: string,
): Record<string, any>[] | undefined {
  const operationGroups: Record<string, any>[] = [];

  for (const method of client.methods) {
    if (method.kind === "clientaccessor") {
      const operationGroup = method.response;
      const name = `${prefix}${operationGroup.name}`;
      let operations: Record<string, any>[] = [];
      for (const method of operationGroup.methods) {
        if (method.kind === "clientaccessor") continue;
        operations = operations.concat(emitMethod(context, rootClient, method, name));
      }
      operationGroups.push({
        name: name,
        className: name,
        propertyName: operationGroup.name,
        operations: operations,
        operationGroups: emitOperationGroups(context, operationGroup, rootClient, name),
      });
    }
  }

  // root client should deal with mixin operation group
  if (prefix === "") {
    let operations: Record<string, any>[] = [];
    for (const method of client.methods) {
      if (method.kind === "clientaccessor") continue;
      operations = operations.concat(emitMethod(context, rootClient, method, ""));
    }
    if (operations.length > 0) {
      operationGroups.push({
        name: "",
        className: "",
        propertyName: "",
        operations: operations,
      });
    }
  }

  return operationGroups.length > 0 ? operationGroups : undefined;
}

function emitClient<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  client: SdkClientType<TServiceOperation>,
): Record<string, any> {
  if (client.initialization) {
    context.__endpointPathParameters = [];
  }
  const parameters =
    client.initialization?.properties
      .map((x) => emitMethodParameter(context, x))
      .reduce((a, b) => [...a, ...b]) ?? [];

  const endpointParameter = client.initialization?.properties.find((x) => x.kind === "endpoint") as
    | SdkEndpointParameter
    | undefined;
  const operationGroups = emitOperationGroups(context, client, client, "");
  let url: string | undefined;
  if (endpointParameter?.type.kind === "union") {
    url = (endpointParameter.type.variantTypes[0] as SdkEndpointType).serverUrl;
  } else {
    url = endpointParameter?.type.serverUrl;
  }
  return {
    name: client.name,
    description: client.description ?? "",
    parameters,
    operationGroups,
    url,
    apiVersions: client.apiVersions,
    arm: context.arm,
  };
}

export function emitCodeModel<TServiceOperation extends SdkServiceOperation>(
  sdkContext: PythonSdkContext<TServiceOperation>,
) {
  // Get types
  const sdkPackage = sdkContext.sdkPackage;
  const codeModel: Record<string, any> = {
    namespace: removeUnderscoresFromNamespace(sdkPackage.rootNamespace).toLowerCase(),
    clients: [],
    subnamespaceToClients: {},
  };
  for (const client of sdkPackage.clients) {
    codeModel["clients"].push(emitClient(sdkContext, client));
    if (client.nameSpace === sdkPackage.rootNamespace) {
    } else {
      codeModel["subnamespaceToClients"][client.nameSpace] = emitClient(sdkContext, client);
    }
  }
  // loop through models and enums since there may be some orphaned models needs to be generated
  for (const model of sdkPackage.models) {
    if (
      model.name === "" ||
      ((model.usage & UsageFlags.Spread) > 0 &&
        (model.usage & UsageFlags.Input) === 0 &&
        (model.usage & UsageFlags.Output) === 0)
    ) {
      continue;
    }
    if (!disableGenerationMap.has(model)) {
      getType(sdkContext, model);
    }
  }
  for (const sdkEnum of sdkPackage.enums) {
    if (sdkEnum.usage === UsageFlags.ApiVersionEnum) {
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
