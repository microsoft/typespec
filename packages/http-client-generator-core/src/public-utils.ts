import {
  Diagnostic,
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Scalar,
  Type,
  Union,
  UnionVariant,
  createDiagnosticCollector,
  getEffectiveModelType,
  getFriendlyName,
  getNamespaceFullName,
  ignoreDiagnostics,
  isGlobalNamespace,
  isService,
  resolveEncodedName,
} from "@typespec/compiler";
import {
  HttpOperation,
  Visibility,
  getHttpOperation,
  getServers,
  isMetadata,
  isVisible,
} from "@typespec/http";
import { getOperationId } from "@typespec/openapi";
import { Version, getVersions } from "@typespec/versioning";
import { pascalCase } from "change-case";
import { getClientLocation, getClientNameOverride, getIsApiVersion } from "./decorators.js";
import {
  DecoratedType,
  SdkBodyParameter,
  SdkClient,
  SdkClientType,
  SdkCookieParameter,
  SdkHeaderParameter,
  SdkHttpOperation,
  SdkHttpOperationExample,
  SdkMethodParameter,
  SdkModelPropertyType,
  SdkPathParameter,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkServiceOperation,
  SdkType,
  TCGCContext,
} from "./interfaces.js";
import {
  AllScopes,
  ContextNode,
  TspLiteralType,
  hasNoneVisibility,
  listAllUserDefinedNamespaces,
  removeVersionsLargerThanExplicitlySpecified,
  resolveDuplicateGenearatedName,
} from "./internal-utils.js";

/**
 * Return the default api version for a versioned service. Will return undefined if one does not exist
 * @param program
 * @param serviceNamespace
 * @returns
 */
export function getDefaultApiVersion(
  context: TCGCContext,
  serviceNamespace: Namespace,
): Version | undefined {
  try {
    const versions = getVersions(context.program, serviceNamespace)[1]!.getVersions();
    removeVersionsLargerThanExplicitlySpecified(context, versions);
    // follow versioning principals of the versioning library and return last in list
    return versions[versions.length - 1];
  } catch (e) {
    return undefined;
  }
}

/**
 * Return whether a parameter is the Api Version parameter of a client
 * @param program
 * @param parameter
 * @returns
 */
export function isApiVersion(context: TCGCContext, type: ModelProperty): boolean {
  // author's customization is the highest priority
  const override = getIsApiVersion(context, type);
  if (override !== undefined) {
    return override;
  }
  // if the service is not versioning, then no api version parameter
  const versionEnumSets = [...context.getPackageVersionEnum().values()];
  if (versionEnumSets.length === 0) {
    return false;
  }
  // if the parameter type is the version enum, then it is api version
  if (versionEnumSets.some((versionEnum) => type.type === versionEnum)) {
    return true;
  }
  // otherwise, only consider name-based matching for http metadata parameters
  // (header/query/path/cookie/statusCode) or server URL template parameters.
  // A regular body model property whose name happens to be `apiVersion`/`api-version`
  // should not be treated as an api version parameter.
  if (!isMetadata(context.program, type) && !isServerUrlTemplateParam(context, type)) {
    return false;
  }
  return (
    type.name.toLowerCase().includes("apiversion") ||
    type.name.toLowerCase().includes("api-version")
  );
}

/**
 * Return whether a model property is a server URL template parameter (i.e., a
 * path-segment variable declared in the `@server` decorator's parameter model).
 * These parameters are not annotated with HTTP metadata decorators, but they
 * represent URL template variables and should still be eligible for API-version
 * name matching.
 */
function isServerUrlTemplateParam(context: TCGCContext, type: ModelProperty): boolean {
  for (const ns of listAllServiceNamespaces(context)) {
    const servers = getServers(context.program, ns);
    if (servers) {
      for (const server of servers) {
        for (const param of server.parameters.values()) {
          if (param === type) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/**
 * If the given type is an anonymous model, returns a named model with same shape.
 * The finding logic will ignore all the properties of header/query/path/status-code metadata,
 * as well as the properties that are not visible in the given visibility if provided.
 * If the model found is also anonymous, the input type is returned unchanged.
 *
 * @param context
 * @param type
 * @returns
 */
export function getEffectivePayloadType(
  context: TCGCContext,
  type: Model,
  visibility?: Visibility,
): Model {
  const program = context.program;

  // if a type has name, we should resolve the name
  // this logic is for template cases, for e.g.,
  // model Catalog is TrackedResource<CatalogProperties>{}
  // model Deployment is TrackedResource<DeploymentProperties>{}
  // when pass them to getEffectiveModelType, we will get two different types
  // with the same name "TrackedResource" which will loose original infomation
  if (type.name) {
    return type;
  }
  const effective = getEffectiveModelType(
    program,
    type,
    (t) =>
      !isMetadata(context.program, t) &&
      !hasNoneVisibility(context, t) &&
      (visibility === undefined || isVisible(program, t, visibility)),
  );
  if (effective.name) {
    return effective;
  }
  return type;
}

/**
 * Get the library and wire name of a model property. Takes `@clientName` and `@encodedName` into account
 * @param context
 * @param property
 * @returns a tuple of the library and wire name for a model property
 */
export function getPropertyNames(context: TCGCContext, property: ModelProperty): [string, string] {
  return [getLibraryName(context, property), getWireName(context, property)];
}

/**
 * Get the library name of a property / parameter / operation / model / enum. Takes projections into account
 *
 * Returns name in the following order of priority
 * 1. language emitter name, i.e. @clientName("csharpSpecificName", "csharp") => "csharpSpecificName"
 * 2. client name, i.e. @clientName(""clientName") => "clientName"
 * 3. deprecated projected name
 * 4. friendly name, i.e. @friendlyName("friendlyName") => "friendlyName"
 * 5. name in typespec
 *
 * @param context
 * @param type
 * @returns the library name for a typespec type
 */
export function getLibraryName(
  context: TCGCContext,
  type: Type & { name?: string | symbol },
  scope?: string | typeof AllScopes,
): string {
  // 1. check if there's a client name
  const emitterSpecificName = getClientNameOverride(context, type, scope);
  if (emitterSpecificName && emitterSpecificName !== type.name) return emitterSpecificName;

  // 2. check if there's a friendly name, if so return friendly name
  const friendlyName = getFriendlyName(context.program, type);
  if (friendlyName) return friendlyName;

  // 3. if type is derived from template and name is the same as template, add template parameters' name as suffix
  if (
    typeof type.name === "string" &&
    type.name !== "" &&
    (type.kind === "Model" || type.kind === "Union") &&
    type.templateMapper?.args
  ) {
    const generatedName = context.__generatedNames.get(type);
    if (generatedName) return generatedName;
    return resolveDuplicateGenearatedName(
      context,
      type,
      type.name +
        type.templateMapper.args
          .filter(
            (arg): arg is Model | Enum =>
              "kind" in arg &&
              (arg.kind === "Model" || arg.kind === "Enum" || arg.kind === "Union") &&
              arg.name !== undefined &&
              arg.name.length > 0,
          )
          .map((arg) => pascalCase(arg.name))
          .join(""),
    );
  }

  return typeof type.name === "string" ? type.name : "";
}

/**
 * Get the serialized name of a type.
 * @param context
 * @param type
 * @returns
 */
export function getWireName(context: TCGCContext, type: Type & { name: string }) {
  const encodedName = resolveEncodedName(context.program, type, "application/json");
  if (encodedName !== type.name) return encodedName;
  return type.name;
}

/**
 * Helper function to return cross language definition id for a type
 * @param type
 * @returns
 */
export function getCrossLanguageDefinitionId(
  context: TCGCContext,
  type:
    | Union
    | Model
    | Enum
    | Scalar
    | ModelProperty
    | Operation
    | Namespace
    | Interface
    | EnumMember
    | UnionVariant,
  operation?: Operation,
  appendNamespace: boolean = true,
): string {
  let retval: string = typeof type.name === "symbol" ? "anonymous" : type.name || "anonymous";
  let namespace =
    type.kind === "ModelProperty"
      ? type.model?.namespace
      : type.kind === "EnumMember"
        ? type.enum?.namespace
        : type.kind === "UnionVariant"
          ? type.union?.namespace
          : type.namespace;
  switch (type.kind) {
    // Enum and Scalar will always have a name
    case "Union":
    case "Model":
      if (type.name) {
        break;
      }
      // Use the naming context stack to determine the path for this anonymous type
      const contextPath = [...context.__namingContextPath];
      const namingPart = contextPath.slice(findLastNonAnonymousNode(contextPath));
      if (
        namingPart[0]?.type?.kind === "Model" ||
        namingPart[0]?.type?.kind === "Union" ||
        namingPart[0]?.type?.kind === "Operation"
      ) {
        namespace = namingPart[0]?.type?.namespace;
      }
      retval =
        namingPart
          .map((x) => {
            if (x.type?.kind === "Model" || x.type?.kind === "Union") {
              const name = x.type.name;
              return typeof name === "symbol" ? x.name : name || x.name;
            }
            return x.name || "anonymous";
          })
          .join(".") +
        "." +
        retval;
      break;
    case "ModelProperty":
      if (type.model) {
        // operation parameter case
        if (type.model === operation?.parameters) {
          retval = `${getCrossLanguageDefinitionId(context, operation, undefined, false)}.${retval}`;
        } else {
          // Use cached SDK model's crossLanguageDefinitionId if available to avoid stack context issues
          const cachedSdkModel = context.__referencedTypeCache.get(type.model);
          if (cachedSdkModel?.crossLanguageDefinitionId) {
            // Cached ID already includes namespace, return directly
            return `${cachedSdkModel.crossLanguageDefinitionId}.${retval}`;
          }
          retval = `${getCrossLanguageDefinitionId(context, type.model, operation, false)}.${retval}`;
        }
      }
      break;
    case "Operation":
      if (type.interface) {
        retval = `${getCrossLanguageDefinitionId(context, type.interface, undefined, false)}.${retval}`;
      }
      break;
    case "EnumMember":
      if (type.enum) {
        retval = `${getCrossLanguageDefinitionId(context, type.enum, operation, false)}.${retval}`;
      }
      break;
    case "UnionVariant":
      if (type.union) {
        retval = `${getCrossLanguageDefinitionId(context, type.union, operation, false)}.${retval}`;
      }
      break;
  }
  if (appendNamespace && namespace && getNamespaceFullName(namespace)) {
    retval = `${getNamespaceFullName(namespace)}.${retval}`;
  }
  return retval;
}

/**
 * Helper function return the cross langauge package id for a package
 */
export function getCrossLanguagePackageId(context: TCGCContext): [string, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const serviceNamespaces = listAllServiceNamespaces(context);
  if (serviceNamespaces.length === 0) return diagnostics.wrap("");
  return diagnostics.wrap(getNamespaceFullName(serviceNamespaces[0]));
}

/**
 * Create a name for anonymous model
 * @param context
 * @param type
 */
export function getGeneratedName(
  context: TCGCContext,
  type: Model | Union | TspLiteralType,
  _operation?: Operation,
): string {
  const generatedName = context.__generatedNames.get(type);
  if (generatedName) return generatedName;

  // Use the naming context stack to determine the path for this anonymous type
  const contextPath = [...context.__namingContextPath];
  const createdName = buildNameFromContextPaths(context, type, contextPath);
  return createdName;
}

function findLastNonAnonymousNode(contextPath: ContextNode[]): number {
  let lastNonAnonymousModelNodeIndex = contextPath.length - 1;
  while (lastNonAnonymousModelNodeIndex >= 0) {
    const currType = contextPath[lastNonAnonymousModelNodeIndex].type;
    // If type is undefined, treat as anonymous (continue looking)
    if (
      currType &&
      (currType.kind === "Model" || currType.kind === "Union" || currType.kind === "Operation") &&
      currType.name
    ) {
      // it's non anonymous node
      break;
    } else {
      --lastNonAnonymousModelNodeIndex;
    }
  }
  return lastNonAnonymousModelNodeIndex;
}

/**
 * The logic is basically three steps:
 * 1. find the last nonanonymous model node, this node can be operation node or model node which is not anonymous
 * 2. build the name from the last nonanonymous model node to the end of the path
 * 3. simplely handle duplication with adding number suffix
 * @param contextPaths
 * @returns
 */
function buildNameFromContextPaths(
  context: TCGCContext,
  type: Union | Model | TspLiteralType,
  contextPath: ContextNode[],
): string {
  // fallback: when no context path, use "Anonymous" + type kind with deduplicating suffix
  if (contextPath.length === 0) {
    return resolveDuplicateGenearatedName(context, type, `Anonymous${type.kind}`);
  }

  // 1. find the last non-anonymous model node
  const lastNonAnonymousNodeIndex = findLastNonAnonymousNode(contextPath);
  // 2. build name
  // When all nodes are anonymous (e.g. types inside orphan unions), lastNonAnonymousNodeIndex is -1.
  // Use 0 as the start index to avoid accessing contextPath[-1].
  let createName: string = "";
  for (let j = Math.max(0, lastNonAnonymousNodeIndex); j < contextPath.length; j++) {
    const currContextPathType = contextPath[j]?.type;
    if (
      currContextPathType?.kind === "String" ||
      currContextPathType?.kind === "Number" ||
      currContextPathType?.kind === "Boolean"
    ) {
      // constant type
      createName = `${createName}${pascalCase(contextPath[j].name)}`;
    } else if (!currContextPathType?.name || currContextPathType.kind === "Operation") {
      // is anonymous node or operation node
      createName = `${createName}${pascalCase(contextPath[j].name)}`;
    } else {
      // is non-anonymous node, use type name
      createName = `${createName}${currContextPathType!.name!}`;
    }
  }
  // 3. simplely handle duplication
  createName = resolveDuplicateGenearatedName(context, type, createName);
  return createName;
}

export function getHttpOperationWithCache(
  context: TCGCContext,
  operation: Operation,
): HttpOperation {
  if (context.__httpOperationCache?.has(operation)) {
    return context.__httpOperationCache.get(operation)!;
  }
  const httpOperation = ignoreDiagnostics(getHttpOperation(context.program, operation));
  context.__httpOperationCache!.set(operation, httpOperation);
  return httpOperation;
}

/**
 * Get the examples for a given http operation.
 */
export function getHttpOperationExamples(
  context: TCGCContext,
  operation: HttpOperation,
): SdkHttpOperationExample[] {
  return context.__httpOperationExamples.get(operation) ?? [];
}

/**
 * Judge whether a type is a paged result model.
 *
 * @param context TCGC context
 * @param t Any TCGC types
 * @returns
 */
export function isPagedResultModel(context: TCGCContext, t: SdkType): boolean {
  return context.__pagedResultSet.has(t);
}

/**
 * Find corresponding http parameter list for a client initialization parameter, a service method parameter or a property of a service method parameter.
 *
 * @param method
 * @param param
 * @returns
 */
export function getHttpOperationParameter(
  method: SdkServiceMethod<SdkHttpOperation>,
  param: SdkMethodParameter | SdkModelPropertyType,
):
  | SdkPathParameter
  | SdkQueryParameter
  | SdkHeaderParameter
  | SdkCookieParameter
  | SdkBodyParameter
  | SdkModelPropertyType
  | undefined {
  const operation = method.operation;
  // BFS to find the corresponding http parameter.
  // An http parameter will be mapped to a method/client parameter, several method/client parameters (body spread case), or one property of a method property (metadata on property case).
  // So, when we try to find which http parameter a parameter or property corresponds to, we compare the `correspondingMethodParams` list directly.
  // If a method parameter is spread case, then we need to find the cooresponding http body parameter's property.
  for (const p of operation.parameters) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    for (const cp of p.correspondingMethodParams) {
      if (cp === param) {
        return p;
      }
    }
  }
  if (operation.bodyParam) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    for (const cp of operation.bodyParam.correspondingMethodParams) {
      if (cp === param) {
        if (operation.bodyParam.type.kind === "model" && operation.bodyParam.type !== param.type) {
          return operation.bodyParam.type.properties.find(
            (p) => p.kind === "property" && p.name === param.name,
          ) as SdkModelPropertyType | undefined;
        }
        return operation.bodyParam;
      }
    }
  }
  return undefined;
}

/**
 * Find corresponding http parameter list for a client initialization parameter.
 *
 * @param method
 * @param param
 * @returns
 */
export function getHttpOperationParametersForClientParameter(
  client: SdkClientType<SdkHttpOperation>,
  param: SdkMethodParameter | SdkModelPropertyType,
): (
  | SdkPathParameter
  | SdkQueryParameter
  | SdkHeaderParameter
  | SdkCookieParameter
  | SdkBodyParameter
  | SdkModelPropertyType
)[] {
  const result = [];
  for (const method of client.methods) {
    const httpParam = getHttpOperationParameter(method, param);
    if (httpParam) {
      result.push(httpParam);
    }
  }
  return result;
}

/**
 * Currently, listServices can only be called from a program instance. This doesn't work well if we're doing mutation,
 * because we want to just mutate the global namespace once, then find all of the services in the program, since we aren't
 * able to explicitly tell listServices to iterate over our specific mutated global namespace. We're going to use this function
 * instead to list all of the services in the global namespace.
 *
 * See https://github.com/microsoft/typespec/issues/6247
 *
 * @param context
 */
export function listAllServiceNamespaces(context: TCGCContext): Namespace[] {
  const serviceNamespaces: Namespace[] = [];
  for (const ns of listAllUserDefinedNamespaces(context)) {
    if (isService(context.program, ns)) {
      serviceNamespaces.push(ns);
    }
  }
  return serviceNamespaces;
}

/**
 * Calculate the operation ID for a given operation.
 *
 * @param context TCGC context
 * @param operation
 * @param honorRenaming
 * @returns
 */
export function resolveOperationId(
  context: TCGCContext,
  operation: Operation,
  honorRenaming: boolean = false,
) {
  const { program } = context;
  // if @operationId was specified use that value
  const explicitOperationId = getOperationId(program, operation);
  if (explicitOperationId) {
    return explicitOperationId;
  }

  const operationName = honorRenaming ? getLibraryName(context, operation) : operation.name;

  let operationInterface: Interface | undefined = operation.interface;
  let operationNamespace: Namespace | undefined = operation.namespace;

  const clientLocation = getClientLocation(context, operation);

  if (clientLocation) {
    if (typeof clientLocation === "string") {
      return `${clientLocation}_${operationName}`;
    }
    if (clientLocation.kind === "Interface") {
      operationInterface = clientLocation;
    } else {
      operationInterface = undefined;
      operationNamespace = clientLocation;
    }
  }

  if (operationInterface) {
    return `${honorRenaming ? getLibraryName(context, operationInterface) : operationInterface.name}_${operationName}`;
  }
  if (
    operationNamespace === undefined ||
    isGlobalNamespace(program, operationNamespace) ||
    isService(program, operationNamespace)
  ) {
    return operationName;
  }

  return `${honorRenaming ? getLibraryName(context, operationNamespace) : operationNamespace.name}_${operationName}`;
}

/**
 * Get the path of a client in the client hierarchy.
 * For root clients, this returns just the client name.
 * For sub clients, this returns the full path like "RootClient.SubClient.NestedClient".
 *
 * @param client The SdkClientType to get the path for
 * @returns The client path string
 */
export function getClientPath<TServiceOperation extends SdkServiceOperation>(
  client: SdkClientType<TServiceOperation>,
): string {
  const parts: string[] = [client.name];
  let current = client.parent;
  while (current) {
    parts.unshift(current.name);
    current = current.parent;
  }
  return parts.join(".");
}

/**
 * Judge whether a model's property is an HTTP metadata.
 * @param context TCGC context
 * @param property
 * @returns
 */
export function isHttpMetadata(context: TCGCContext, property: SdkModelPropertyType): boolean {
  return property.__raw !== undefined && isMetadata(context.program, property.__raw);
}

export function getNamespaceFromType(type: Type | SdkClient | undefined): Namespace | undefined {
  if (type === undefined) {
    return undefined;
  }
  if (type.kind === "SdkClient") {
    const rawType = type.type;
    if (rawType === undefined) {
      return undefined;
    }
    if (rawType.kind === "Namespace") {
      return rawType;
    }
    return rawType.namespace;
  }
  if ("namespace" in type) {
    return type.namespace;
  }
  return undefined;
}

const CLIENT_OPTION_DECORATOR_NAME = "TypeSpec.ClientGenerator.Core.@clientOption";

/**
 * Get the value of a client option by key from a decorated SDK type.
 *
 * @param type - A decorated SDK type (model, enum, operation, property, client, namespace, etc.)
 * @param key - The name of the client option to look up
 * @returns The option value, or `undefined` if the option is not set
 *
 * @example
 * ```typescript
 * const sdkModel = context.sdkPackage.models.find(m => m.name === "MyModel");
 * const value = getClientOptions(sdkModel, "enableFeatureFoo");
 * ```
 */
export function getClientOptions<T extends DecoratedType>(type: T, key: string): unknown {
  const option = type.decorators
    .filter((d) => d.name === CLIENT_OPTION_DECORATOR_NAME)
    .find((d) => d.arguments.name === key);
  return option?.arguments.value;
}
