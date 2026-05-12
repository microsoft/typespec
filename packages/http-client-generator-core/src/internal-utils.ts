import {
  BooleanLiteral,
  compilerAssert,
  createDiagnosticCollector,
  Diagnostic,
  Enum,
  getDeprecationDetails,
  getDoc,
  getLifecycleVisibilityEnum,
  getNamespaceFullName,
  getSummary,
  getVisibilityForClass,
  ignoreDiagnostics,
  Interface,
  isNeverType,
  isNullType,
  isTemplateDeclaration,
  isVoidType,
  listServices,
  Model,
  ModelProperty,
  Namespace,
  Numeric,
  NumericLiteral,
  Operation,
  Program,
  StringLiteral,
  Type,
  Union,
  Value,
} from "@typespec/compiler";
import {
  unsafe_mutateSubgraphWithNamespace,
  unsafe_MutatorWithNamespace,
  unsafe_Realm,
} from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/typekit";
import {
  Authentication,
  getHeaderFieldOptions,
  getPathParamOptions,
  getQueryParamOptions,
  HttpOperation,
  HttpOperationResponseContent,
  HttpPayloadBody,
  HttpServer,
  isHeader,
  isPathParam,
  isQueryParam,
} from "@typespec/http";
import {
  getAddedOnVersions,
  getRemovedOnVersions,
  getVersioningMutators,
  getVersions,
} from "@typespec/versioning";
import {
  getAlternateType,
  getClientDocExplicit,
  getClientLocation,
  getIsApiVersion,
  getLegacyHierarchyBuilding,
  getOverriddenClientMethod,
  getParamAlias,
  getUsageOverride,
} from "./decorators.js";
import {
  DecoratorInfo,
  ExternalTypeInfo,
  SdkBuiltInType,
  SdkClient,
  SdkClientType,
  SdkEnumType,
  SdkHeaderParameter,
  SdkMethodParameter,
  SdkServiceOperation,
  SdkType,
  TCGCContext,
} from "./interfaces.js";
import { createDiagnostic, createStateSymbol, reportDiagnostic } from "./lib.js";
import {
  getCrossLanguageDefinitionId,
  getHttpOperationWithCache,
  isApiVersion,
} from "./public-utils.js";
import { getClientTypeWithDiagnostics } from "./types.js";

export interface TCGCEmitterOptions extends BrandedSdkEmitterOptionsInterface {
  "emitter-name"?: string;
}

export interface UnbrandedSdkEmitterOptionsInterface {
  "generate-protocol-methods"?: boolean;
  "generate-convenience-methods"?: boolean;
  "api-version"?: string;
  license?: {
    name: string;
    company?: string;
    link?: string;
    header?: string;
    description?: string;
  };
}

export interface BrandedSdkEmitterOptionsInterface extends UnbrandedSdkEmitterOptionsInterface {
  "examples-dir"?: string;
  namespace?: string;
}

export const AllScopes = Symbol.for("@typespec/http-client-generator-core/all-scopes");

export const clientNameKey = createStateSymbol("clientName");
export const clientNamespaceKey = createStateSymbol("clientNamespace");
export const negationScopesKey = createStateSymbol("negationScopes");
export const scopeKey = createStateSymbol("scope");
export const clientKey = createStateSymbol("client");
export const clientLocationKey = createStateSymbol("clientLocation");
export const omitOperation = createStateSymbol("omitOperation");
export const overrideKey = createStateSymbol("override");
export const usageKey = createStateSymbol("usage");
export const legacyHierarchyBuildingKey = createStateSymbol("legacyHierarchyBuilding");

export function hasExplicitClient(context: TCGCContext): boolean {
  return listScopedDecoratorData(context, clientKey).size > 0;
}

export function listScopedDecoratorData(
  context: TCGCContext,
  key: symbol,
  languageScope?: string | typeof AllScopes,
): Map<Type, any> {
  const scope = languageScope ?? context.emitterName;
  const retval: Map<Type, any> = new Map();
  for (const [type, data] of context.program.stateMap(key).entries()) {
    if (data[scope]) {
      // positive scope case
      retval.set(type, data[scope]);
    } else if (data[negationScopesKey]) {
      // negative scope case
      if (data[negationScopesKey].includes(scope)) {
        // if the scope is negated, we should not include it
        continue;
      } else {
        // if the scope is not negated, we should include it
        retval.set(type, data[AllScopes]);
      }
    } else if (data[AllScopes]) {
      // all scopes case
      retval.set(type, data[AllScopes]);
    }
  }
  return retval;
}

export function getScopedDecoratorData(
  context: TCGCContext,
  key: symbol,
  target: Type,
  languageScope?: string | typeof AllScopes,
): any {
  const retval: Record<string | symbol, any> = context.program.stateMap(key).get(target);
  if (retval === undefined) return retval;
  if (languageScope === AllScopes) {
    return retval[languageScope];
  }
  if (languageScope === undefined || typeof languageScope === "string") {
    const scope = languageScope ?? context.emitterName;
    if (scope in retval) return retval[scope];

    // if the scope is negated, we should return undefined
    // if the scope is not negated, we should return the value for AllScopes
    const negationScopes = retval[negationScopesKey];
    if (negationScopes !== undefined && negationScopes.includes(scope)) {
      return undefined;
    }
  }
  return retval[AllScopes]; // in this case it applies to all languages
}

/**
 * Parse a scope string to extract negation scopes and positive scopes.
 * Supports two syntax patterns:
 * 1. !(scope1, scope2,...) - Grouped negation
 * 2. !scope1, !scope2, scope3, ... - Individual negation with positive scopes
 *
 * @param scope The scope string to parse
 * @returns A tuple of [negationScopes, positiveScopes] where each can be undefined if not present
 */
export function parseScopes(scope?: string): [string[]?, string[]?] {
  if (scope === undefined) {
    return [undefined, undefined];
  }

  // handle !(scope1, scope2,...) syntax
  const negationScopeRegex = /!\((.*?)\)/;
  const negationScopeMatch = scope.match(negationScopeRegex);
  if (negationScopeMatch) {
    return [negationScopeMatch[1].split(",").map((s) => s.trim()), undefined];
  }

  // handle !scope1, !scope2, scope3, ... syntax
  const splitScopes = scope.split(",").map((s) => s.trim());
  const negationScopes: string[] = [];
  const scopes: string[] = [];
  for (const s of splitScopes) {
    if (s.startsWith("!")) {
      negationScopes.push(s.slice(1));
    } else {
      scopes.push(s);
    }
  }
  return [negationScopes, scopes];
}

/**
 * Check if a scope string is applicable to the given emitter name.
 * Handles negation scopes like "!python" or "!(java, python)".
 *
 * @param scopeArg The scope string from the decorator argument
 * @param emitterName The current emitter name
 * @returns true if the decorator should be included, false otherwise
 */
function isScopeApplicable(scopeArg: string, emitterName: string): boolean {
  const [negationScopes, positiveScopes] = parseScopes(scopeArg);

  // If there are positive scopes specified
  if (positiveScopes !== undefined && positiveScopes.length > 0) {
    // If the emitter matches any positive scope, include it
    if (positiveScopes.includes(emitterName)) {
      return true;
    }
    // If positive scopes specified but emitter doesn't match any, and no negation scopes
    // then the decorator doesn't apply to this emitter
    if (negationScopes === undefined || negationScopes.length === 0) {
      return false;
    }
  }

  // If there are negation scopes
  if (negationScopes !== undefined && negationScopes.length > 0) {
    // If the emitter is in the negation list, exclude it
    if (negationScopes.includes(emitterName)) {
      return false;
    }
    // If not in negation list, include it (applies to all except negated scopes)
    return true;
  }

  // No scopes specified at all (empty string edge case)
  return true;
}

/**
 *
 * @param emitterName Full emitter name
 * @returns The language of the emitter. I.e. "@azure-tools/typespec-csharp" will return "csharp"
 */
export function parseEmitterName(
  program: Program,
  emitterName?: string,
): [string, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if (!emitterName) {
    diagnostics.add(
      createDiagnostic({
        code: "no-emitter-name",
        format: {},
        target: program.getGlobalNamespaceType(),
      }),
    );
    return diagnostics.wrap("none");
  }
  const regex = /(?:cadl|typespec|client|server)-([^\\/-]*)/;
  const match = emitterName.match(regex);
  if (!match || match.length < 2) return diagnostics.wrap("none");
  const language = match[1];
  if (["typescript", "ts"].includes(language)) return diagnostics.wrap("javascript");
  return diagnostics.wrap(language);
}

/**
 * Find the service namespace that contains the given operation.
 * @param services Array of service namespaces
 * @param operation The operation to find the service for
 * @returns The service namespace that contains the operation
 */
export function findServiceForOperation(services: Namespace[], operation: Operation): Namespace {
  // Follow the sourceOperation chain to find the original service namespace.
  // This is needed when operations are defined using `is` in customization interfaces
  // (e.g., `opB is ServiceB.Operations.opB`), where the operation's namespace is the
  // customization namespace rather than the original service namespace.
  let current: Operation | undefined = operation;
  while (current) {
    let namespace = current.namespace;
    while (namespace) {
      if (services.includes(namespace)) {
        return namespace;
      }
      namespace = namespace.namespace;
    }
    current = current.sourceOperation;
  }
  // Fallback to the first service. This can happen when an operation is defined outside
  // of any service namespace (e.g., in Azure.ResourceManager or other shared namespaces)
  // and is imported into a client that combines multiple services. In such cases,
  // we use the first service's api version as the default.
  return services[0];
}

/**
 *
 * @param context
 * @param type The type that we are adding api version information onto
 * @param client The client or sub clients that contains the operation
 * @param operation The operation that contains the api version parameter (needed for multi-service sub clients)
 * @returns Whether the type is the api version parameter and the default value for the client
 */
export function updateWithApiVersionInformation(
  context: TCGCContext,
  type: ModelProperty,
  client?: SdkClient,
  operation?: Operation,
): {
  isApiVersionParam: boolean;
  clientDefaultValue?: string;
} {
  const isApiVersionParam = isApiVersion(context, type);
  if (!isApiVersionParam || !client) {
    return { isApiVersionParam, clientDefaultValue: undefined };
  }

  // For single-service clients, use the cached value
  if (client.services.length <= 1) {
    return {
      isApiVersionParam,
      clientDefaultValue: context.__clientApiVersionDefaultValueCache.get(client),
    };
  }

  // For multi-service clients/sub clients, we need to find the api version
  // from the operation's specific service
  if (operation) {
    const service = findServiceForOperation(client.services, operation);
    const packageVersions = context.getPackageVersions().get(service) || [];
    return {
      isApiVersionParam,
      clientDefaultValue:
        packageVersions.length > 0 ? packageVersions[packageVersions.length - 1] : undefined,
    };
  }

  // No operation provided for multi-service client, return undefined
  return { isApiVersionParam, clientDefaultValue: undefined };
}

export function filterApiVersionsWithDecorators(
  context: TCGCContext,
  type: Type,
  apiVersions: string[],
): string[] {
  const addedOnVersions = getAddedOnVersions(context.program, type)?.map((x) => x.value) ?? [];
  const removedOnVersions = getRemovedOnVersions(context.program, type)?.map((x) => x.value) ?? [];
  let added: boolean = addedOnVersions.length ? false : true;
  let addedCounter = 0;
  let removeCounter = 0;
  const retval: string[] = [];
  for (let i = 0; i < apiVersions.length; i++) {
    const version = apiVersions[i];
    if (addedCounter < addedOnVersions.length && version === addedOnVersions[addedCounter]) {
      added = true;
      addedCounter++;
    }
    if (removeCounter < removedOnVersions.length && version === removedOnVersions[removeCounter]) {
      added = false;
      removeCounter++;
    }
    if (added) {
      // only add version smaller than config
      if (
        context.apiVersion === undefined ||
        context.apiVersion === "latest" ||
        context.apiVersion === "all" ||
        apiVersions.indexOf(context.apiVersion) >= i
      ) {
        retval.push(version);
      }
    }
  }
  return retval;
}

/**
 *
 * @param context
 * @param type
 * @param client If it's associated with a client, meaning it's a param etc, we can see if it's available on that client
 * @returns All api versions the type is available on
 */
export function getAvailableApiVersions(
  context: TCGCContext,
  type: Type,
  wrapper?: Type,
): string[] {
  let wrapperApiVersions: string[] = [];
  if (wrapper) {
    wrapperApiVersions = context.getApiVersionsForType(wrapper);
  }

  const allApiVersions =
    getVersions(context.program, type)[1]
      ?.getVersions()
      .map((x) => x.value) || [];

  const apiVersions = wrapperApiVersions.length ? wrapperApiVersions : allApiVersions;
  if (!apiVersions) return [];
  const explicitlyDecorated = filterApiVersionsWithDecorators(context, type, apiVersions);
  if (explicitlyDecorated.length) {
    context.setApiVersionsForType(type, explicitlyDecorated);
    return explicitlyDecorated;
  }
  context.setApiVersionsForType(type, wrapperApiVersions);
  return wrapperApiVersions;
}

/**
 *
 * @param type
 * @returns A unique id for each type so we can do set comparisons
 */
export function getHashForType(type: SdkType): string {
  if (type.kind === "array" || type.kind === "dict") {
    return `${type.kind}[${getHashForType(type.valueType)}]`;
  }
  if (type.kind === "enum" || type.kind === "model" || type.kind === "enumvalue") return type.name;
  if (type.kind === "union") {
    return type.variantTypes.map((x) => getHashForType(x)).join("|");
  }
  return type.kind;
}

interface DefaultSdkTypeBase<TKind> {
  __raw: Type;
  deprecation?: string;
  kind: TKind;
  decorators: DecoratorInfo[];
  external?: ExternalTypeInfo;
  doc?: string;
  summary?: string;
}

/**
 * Helper function to return default values for encode etc
 * @param type
 */
export function getSdkTypeBaseHelper<TKind>(
  context: TCGCContext,
  type: Type,
  kind: TKind,
): [DefaultSdkTypeBase<TKind>, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  const base: DefaultSdkTypeBase<TKind> = {
    __raw: type,
    deprecation: getDeprecationDetails(context.program, type)?.message,
    kind,
    decorators: diagnostics.pipe(getTypeDecorators(context, type)),
    doc: getClientDoc(context, type),
    summary: getSummary(context.program, type),
  };
  if (
    type.kind === "ModelProperty" ||
    type.kind === "Scalar" ||
    type.kind === "Model" ||
    type.kind === "Enum" ||
    type.kind === "Union"
  ) {
    const external = getAlternateType(context, type);
    // Only set external if it's an ExternalTypeInfo (has 'identity' but not 'kind' property), not a regular Type
    if (external && external.kind === "externalTypeInfo") {
      base.external = external;
    }
  }
  return diagnostics.wrap(base);
}

export function getNamespacePrefix(namespace: Namespace): string {
  return namespace ? getNamespaceFullName(namespace) + "." : "";
}

export function getTypeDecorators(
  context: TCGCContext,
  type: Type,
): [DecoratorInfo[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const retval: DecoratorInfo[] = [];
  if ("decorators" in type) {
    for (const decorator of type.decorators) {
      // only process explicitly defined decorators
      if (decorator.definition) {
        const decoratorName = `${getNamespacePrefix(decorator.definition?.namespace)}${decorator.definition?.name}`;
        // white list filtering
        if (
          !context.decoratorsAllowList ||
          !context.decoratorsAllowList.some((x) => new RegExp(x).test(decoratorName))
        ) {
          continue;
        }

        const decoratorInfo: DecoratorInfo = {
          name: decoratorName,
          arguments: {},
        };
        for (let i = 0; i < decorator.args.length; i++) {
          decoratorInfo.arguments[decorator.definition.parameters[i].name] = diagnostics.pipe(
            getDecoratorArgValue(context, decorator.args[i].jsValue, type, decoratorName),
          );
        }

        // Filter by scope - only include decorators that match the current emitter or have no scope
        const scopeArg = decoratorInfo.arguments["scope"];
        if (scopeArg !== undefined && !isScopeApplicable(scopeArg, context.emitterName)) {
          // Skip this decorator if its scope is not applicable to the current emitter
          continue;
        }

        retval.push(decoratorInfo);
      }
    }
  }
  return diagnostics.wrap(retval);
}

function getDecoratorArgValue(
  context: TCGCContext,
  arg:
    | Type
    | Record<string, unknown>
    | Value
    | unknown[]
    | string
    | number
    | boolean
    | Numeric
    | null,
  type: Type,
  decoratorName: string,
): [any, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if (typeof arg === "object" && arg !== null && "kind" in arg) {
    if (arg.kind === "EnumMember") {
      return diagnostics.wrap(diagnostics.pipe(getClientTypeWithDiagnostics(context, arg as any)));
    }
    if (
      arg.kind === "String" ||
      arg.kind === "Number" ||
      arg.kind === "Boolean" ||
      arg.kind === "Value"
    ) {
      return diagnostics.wrap(arg.value);
    }
    diagnostics.add(
      createDiagnostic({
        code: "unsupported-generic-decorator-arg-type",
        target: type,
        format: { decoratorName },
      }),
    );
    return diagnostics.wrap(undefined);
  }
  return diagnostics.wrap(arg);
}

export function intOrFloat(value: number): "int32" | "float32" {
  return value.toString().indexOf(".") === -1 ? "int32" : "float32";
}

/**
 * In the core package, this always returns false.
 * @param t
 * @returns
 */
export function isAzureCoreTspModel(t: Type): boolean {
  return false;
}

export function isAcceptHeader(param: SdkHeaderParameter): boolean {
  return param.kind === "header" && param.serializedName.toLowerCase() === "accept";
}

export function isContentTypeHeader(param: SdkHeaderParameter): boolean {
  return param.kind === "header" && param.serializedName.toLowerCase() === "content-type";
}

export function isHttpOperation(context: TCGCContext, obj: any): obj is HttpOperation {
  return obj?.kind === "Operation" && getHttpOperationWithCache(context, obj) !== undefined;
}

export type TspLiteralType = StringLiteral | NumericLiteral | BooleanLiteral;

/** A node in a context path that tracks the traversal position for naming anonymous types. */
export interface ContextNode {
  name: string;
  // Type can be undefined to indicate "anonymous" context (e.g., when property type is a named union)
  type: Model | Union | TspLiteralType | Operation | undefined;
}

export function getNonNullOptions(type: Union): Type[] {
  return [...type.variants.values()].map((x) => x.type).filter((t) => !isNullType(t));
}

export function getNullOption(type: Union): Type | undefined {
  return [...type.variants.values()].map((x) => x.type).filter((t) => isNullType(t))[0];
}

/**
 * Use this if you are trying to create a generated name for something without an original TypeSpec type.
 *
 * Otherwise, you should use the `getGeneratedName` function.
 * @param context
 */
export function createGeneratedName(
  context: TCGCContext,
  type: Interface | Namespace | Operation,
  suffix: string,
): string {
  return `${getCrossLanguageDefinitionId(context, type).split(".").at(-1)}${suffix}`;
}

export function isSubscriptionId(context: TCGCContext, parameter: { name: string }): boolean {
  return false;
}

export function isNeverOrVoidType(type: Type): boolean {
  return isNeverType(type) || isVoidType(type);
}

export function getAnyType(
  context: TCGCContext,
  type: Type,
): [SdkBuiltInType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap({
    kind: "unknown",
    name: "unknown",
    encode: "string",
    crossLanguageDefinitionId: "",
    decorators: diagnostics.pipe(getTypeDecorators(context, type)),
  });
}

export function getHttpOperationResponseHeaders(
  response: HttpOperationResponseContent,
): ModelProperty[] {
  const headers: ModelProperty[] = response.headers ? Object.values(response.headers) : [];
  if (response.body?.contentTypeProperty) {
    headers.push(response.body.contentTypeProperty);
  }
  return headers;
}

export function removeVersionsLargerThanExplicitlySpecified(
  context: TCGCContext,
  versions: { value: string | number }[],
): void {
  // filter with specific api version
  if (
    context.apiVersion !== undefined &&
    context.apiVersion !== "latest" &&
    context.apiVersion !== "all"
  ) {
    const index = versions.findIndex((version) => version.value === context.apiVersion);
    if (index >= 0) {
      versions.splice(index + 1, versions.length - index - 1);
    }
  }
}

export function filterPreviewVersion(
  context: TCGCContext,
  sdkVersionsEnum: SdkEnumType,
  defaultApiVersion: string,
): void {
  // if they explicitly set an api version, remove larger versions
  removeVersionsLargerThanExplicitlySpecified(context, sdkVersionsEnum.values);
  if (!context.previewStringRegex.test(defaultApiVersion)) {
    sdkVersionsEnum.values = sdkVersionsEnum.values.filter((v) => {
      if (typeof v.value !== "string") {
        return true;
      }

      // Fall back to regex check for backward compatibility
      return !context.previewStringRegex.test(v.value);
    });
  }
}

export function twoParamsEquivalent(
  context: TCGCContext,
  param1?: ModelProperty,
  param2?: ModelProperty,
): boolean {
  if (!param1 || !param2) {
    return false;
  }
  return (
    param1.type === param2.type &&
    (param1.name === param2.name ||
      getParamAlias(context, param1) === param2.name ||
      param1.name === getParamAlias(context, param2))
  );
}

/**
 * If body is from spread, then it does not directly from a model property.
 * @param httpBody
 * @param parameters
 * @returns
 */
export function isHttpBodySpread(httpBody: HttpPayloadBody): boolean {
  return httpBody.bodyKind !== "file" && httpBody.property === undefined;
}

/**
 * If body is from simple spread, then we use the original model as body model. Else we return the body type directly.
 * @param type
 * @returns
 */
export function getHttpBodyType(httpBody: HttpPayloadBody): Type {
  const type = httpBody.type;
  if (isHttpBodySpread(httpBody) && type.kind === "Model") {
    if (type.sourceModels.length === 1 && type.sourceModels[0].usage === "spread") {
      const innerModel = type.sourceModels[0].model;
      // for case: `op test(...Model):void;`
      if (innerModel.name !== "" && innerModel.properties.size === type.properties.size) {
        return innerModel;
      }
      // for case: `op test(@header h: string, @query q: string, ...Model): void;`
      if (
        innerModel.sourceModels.length === 1 &&
        innerModel.sourceModels[0].usage === "spread" &&
        innerModel.sourceModels[0].model.name !== "" &&
        innerModel.sourceModels[0].model.properties.size === type.properties.size
      ) {
        return innerModel.sourceModels[0].model;
      }
    }
    return type;
  }
  return type;
}

export function isOnClient(
  context: TCGCContext,
  type: ModelProperty,
  operation?: Operation,
  versioning?: boolean,
): boolean {
  const clientLocation = getClientLocation(context, type);
  if (
    operation &&
    clientLocation === (getOverriddenClientMethod(context, operation) ?? operation)
  ) {
    // if the type has explicitly been moved to the operation, it is not on the client
    return false;
  }
  // When using @override, @clientLocation might be on the override operation's parameter
  // rather than on the original operation's parameter. Check the override's corresponding
  // parameter for @clientLocation targeting the override operation.
  if (operation) {
    const override = getOverriddenClientMethod(context, operation);
    if (override) {
      for (const [, overrideParam] of override.parameters.properties) {
        if (
          compareModelProperties(context.program, overrideParam, type) &&
          getClientLocation(context, overrideParam) === override
        ) {
          return false;
        }
      }
    }
  }
  return (
    isSubscriptionId(context, type) ||
    (isApiVersion(context, type) && versioning) ||
    (operation !== undefined && getCorrespondingClientParam(context, type, operation) !== undefined)
  );
}

export function getCorrespondingClientParam(
  context: TCGCContext,
  type: ModelProperty,
  operation: Operation,
): SdkMethodParameter | undefined {
  // When @clientLocation explicitly targets this operation, the parameter should stay at
  // the method level and not be mapped to an existing client parameter.
  const clientLocation = getClientLocation(context, type);
  if (
    clientLocation &&
    clientLocation === (getOverriddenClientMethod(context, operation) ?? operation)
  ) {
    return undefined;
  }

  const clientParams = [];
  let client: SdkClient | undefined = context.getClientForOperation(operation);
  while (client) {
    const clientParamsForClient = context.__clientParametersCache.get(client);
    if (clientParamsForClient) {
      clientParams.push(...clientParamsForClient);
    }
    if (!client.parent) {
      break;
    }
    client = client.parent;
  }
  const correspondingClientParam = clientParams?.find((x) =>
    twoParamsEquivalent(context, x.__raw, type),
  );
  if (correspondingClientParam) {
    // If the parameter is explicitly marked as not an API version parameter via @apiVersion(false),
    // it should not be matched to a client API version parameter.
    if (getIsApiVersion(context, type) === false && correspondingClientParam.isApiVersionParam) {
      return undefined;
    }
    return correspondingClientParam;
  }
  return undefined;
}

export function getValueTypeValue(
  value: Value,
): string | boolean | null | number | Array<unknown> | object | undefined {
  switch (value.valueKind) {
    case "ArrayValue":
      return value.values.map((x) => getValueTypeValue(x));
    case "BooleanValue":
    case "StringValue":
    case "NullValue":
      return value.value;
    case "NumericValue":
      return value.value.asNumber();
    case "EnumValue":
      return value.value.value ?? value.value.name;
    case "ObjectValue":
      return Object.fromEntries(
        [...value.properties.keys()].map((x) => [
          x,
          getValueTypeValue(value.properties.get(x)!.value),
        ]),
      );
    default:
      // TODO: handle scalar value
      return undefined;
  }
}

export function hasNoneVisibility(context: TCGCContext, type: ModelProperty): boolean {
  const lifecycle = getLifecycleVisibilityEnum(context.program);
  const visibility = getVisibilityForClass(context.program, type, lifecycle);
  return visibility.size === 0;
}

function listAllNamespaces(
  context: TCGCContext,
  namespace: Namespace,
  retval?: Namespace[],
): Namespace[] {
  if (!retval) {
    retval = [];
  }
  if (retval.includes(namespace)) return retval;
  retval.push(namespace);
  for (const ns of namespace.namespaces.values()) {
    listAllNamespaces(context, ns, retval);
  }
  return retval;
}

export function listAllUserDefinedNamespaces(context: TCGCContext): Namespace[] {
  return listAllNamespaces(context, context.getMutatedGlobalNamespace()).filter((ns) =>
    $(context.program).type.isUserDefined(ns),
  );
}

export function findRootSourceProperty(property: ModelProperty): ModelProperty {
  while (property.sourceProperty) {
    property = property.sourceProperty;
  }
  return property;
}

export function getStreamAsBytes(
  context: TCGCContext,
  type: Type,
): [SdkBuiltInType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const unknownType: SdkBuiltInType = {
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "bytes")),
    name: "bytes",
    encode: "bytes",
    crossLanguageDefinitionId: "",
  };
  return diagnostics.wrap(unknownType);
}

function getVersioningMutator(
  context: TCGCContext,
  service: Namespace,
  apiVersion?: string,
): unsafe_MutatorWithNamespace | undefined {
  const versionMutator = getVersioningMutators(context.program, service);
  if (!versionMutator) return undefined;
  if (versionMutator.kind === "transient") {
    return versionMutator.mutator;
  }
  const mutators = versionMutator.snapshots
    .filter((snapshot) => apiVersion === snapshot.version.value)
    .map((x) => x.mutator);
  compilerAssert(mutators.length === 1, "One api version should not get multiple mutators");

  return mutators[0];
}

export function handleVersioningMutationForGlobalNamespace(context: TCGCContext): Namespace {
  const globalNamespace = context.program.getGlobalNamespaceType();

  // First consider explicit clients
  const servicesNs = new Set<Namespace>();
  listScopedDecoratorData(context, clientKey).forEach((v, k) => {
    // See all explicit clients that in TypeSpec program
    if (!unsafe_Realm.realmForType.has(k)) {
      (v as SdkClient).services.forEach((s) => servicesNs.add(s));
    }
  });

  // Then see the original services
  if (servicesNs.size === 0) {
    listServices(context.program).map((v) => servicesNs.add(v.type));
  }

  // No service, thus no versioning mutation needed
  if (servicesNs.size === 0) return globalNamespace;

  // Multi services' client should not honor the specific api-version set in config
  if (
    servicesNs.size > 1 &&
    context.apiVersion !== undefined &&
    context.apiVersion !== "latest" &&
    context.apiVersion !== "all"
  ) {
    context.apiVersion = undefined;
  }

  // Explicit all API version setting, thus no versioning mutation needed
  if (context.apiVersion === "all") return globalNamespace;

  // Compose service mutators
  const mutators: unsafe_MutatorWithNamespace[] = [];

  for (const serviceNs of servicesNs) {
    const versions = getVersions(context.program, serviceNs)[1]?.getVersions();
    // If the service has no versioning, no mutation needed
    if (!versions || versions.length === 0) return globalNamespace;

    // Single service needs to filter versions based on `apiVersion` config
    if (servicesNs.size === 1) {
      removeVersionsLargerThanExplicitlySpecified(context, versions);
    }

    const versionsValues = versions.map((v) => v.value);

    // Fix apiVersion setting problem only if there's only one service
    if (servicesNs.size === 1) {
      if (
        context.apiVersion !== undefined &&
        context.apiVersion !== "latest" &&
        context.apiVersion !== "all" &&
        !versionsValues.includes(context.apiVersion)
      ) {
        reportDiagnostic(context.program, {
          code: "api-version-undefined",
          format: { version: context.apiVersion },
          target: serviceNs,
        });
        context.apiVersion = versionsValues[versionsValues.length - 1];
      }
    }

    // Get service mutator according to the version setting
    const mutator = getVersioningMutator(
      context,
      serviceNs,
      versionsValues[versionsValues.length - 1],
    );
    if (mutator) mutators.push(mutator);
  }
  if (mutators.length === 0) return globalNamespace;
  const subgraph = unsafe_mutateSubgraphWithNamespace(context.program, mutators, globalNamespace);
  compilerAssert(subgraph.type.kind === "Namespace", "Should not have mutated to another type");
  compilerAssert(subgraph.realm !== null, "Should have a realm after mutation");
  context.__mutatedRealm = subgraph.realm;
  return subgraph.type;
}

export function resolveDuplicateGenearatedName(
  context: TCGCContext,
  type: Union | Model | TspLiteralType,
  createName: string,
): string {
  let duplicateCount = 1;
  const rawCreateName = createName;
  const generatedNames = [...context.__generatedNames.values()];
  while (generatedNames.includes(createName)) {
    createName = `${rawCreateName}${duplicateCount++}`;
  }
  context.__generatedNames.set(type, createName);
  return createName;
}

export function resolveConflictGeneratedName(context: TCGCContext) {
  const userDefinedNames = [...context.__referencedTypeCache.values()]
    .filter((x) => !x.isGeneratedName)
    .map((x) => x.name);
  const generatedNames = [...context.__generatedNames.values()];

  for (const sdkType of context.__referencedTypeCache.values()) {
    if (sdkType.__raw && sdkType.isGeneratedName && userDefinedNames.includes(sdkType.name)) {
      const rawName = sdkType.name;
      let duplicateCount = 1;
      let createName = `${rawName}${duplicateCount++}`;
      while (userDefinedNames.includes(createName) || generatedNames.includes(createName)) {
        createName = `${rawName}${duplicateCount++}`;
      }
      sdkType.name = createName;
      context.__generatedNames.set(sdkType.__raw, createName);
      generatedNames.push(createName);
    }
  }
}

export function getClientDoc(context: TCGCContext, target: Type): string | undefined {
  const clientDocExplicit = getClientDocExplicit(context, target);
  const baseDoc = getDoc(context.program, target);
  if (clientDocExplicit) {
    switch (clientDocExplicit.mode) {
      case "append":
        return baseDoc
          ? `${baseDoc}\n${clientDocExplicit.documentation}`
          : clientDocExplicit.documentation;
      case "replace":
        return clientDocExplicit.documentation;
    }
  }
  return baseDoc;
}

export function compareModelProperties(
  program: Program,
  modelPropA: ModelProperty | undefined,
  modelPropB: ModelProperty | undefined,
): boolean {
  if (!modelPropA || !modelPropB) return false;
  if (modelPropA.name !== modelPropB.name || modelPropA.type !== modelPropB.type) return false;
  const aIsQuery = isQueryParam(program, modelPropA);
  const aIsHeader = isHeader(program, modelPropA);
  const aIsPath = isPathParam(program, modelPropA);
  const bIsQuery = isQueryParam(program, modelPropB);
  const bIsHeader = isHeader(program, modelPropB);
  const bIsPath = isPathParam(program, modelPropB);
  // Return false when both have explicit HTTP parameter kinds but they differ
  const aHasHttpKind = aIsQuery || aIsHeader || aIsPath;
  const bHasHttpKind = bIsQuery || bIsHeader || bIsPath;
  if (aHasHttpKind && bHasHttpKind) {
    if (aIsQuery !== bIsQuery || aIsHeader !== bIsHeader || aIsPath !== bIsPath) return false;
  }
  if (
    aIsQuery &&
    bIsQuery &&
    getQueryParamOptions(program, modelPropA)?.name !==
      getQueryParamOptions(program, modelPropB)?.name
  ) {
    return false;
  }
  if (
    aIsHeader &&
    bIsHeader &&
    getHeaderFieldOptions(program, modelPropA)?.name !==
      getHeaderFieldOptions(program, modelPropB)?.name
  ) {
    return false;
  }
  if (
    aIsPath &&
    bIsPath &&
    getPathParamOptions(program, modelPropA)?.name !==
      getPathParamOptions(program, modelPropB)?.name
  ) {
    return false;
  }
  return true;
}

export function* filterMapValuesIterator<V>(
  iterator: MapIterator<V>,
  predicate: (value: V) => boolean,
): MapIterator<V> {
  for (const value of iterator) {
    if (predicate(value)) {
      yield value;
    }
  }
}

/**
 * Find all entries in a scoped decorator state map where the target matches a specific value
 */
export function findEntriesWithTarget<TSource extends Type, TTarget>(
  context: TCGCContext,
  stateKey: symbol,
  targetValue: TTarget,
  sourceKind?: TSource["kind"],
): TSource[] {
  const results: TSource[] = [];

  for (const [type, target] of listScopedDecoratorData(context, stateKey)) {
    if (sourceKind && type.kind !== sourceKind) {
      continue;
    }
    if (target === targetValue) {
      results.push(type as TSource);
    }
  }
  return results;
}

/**
 * Retrieves Long Running Operation (LRO) metadata for a given operation.
 *
 * In the core package, LRO metadata is not available (it requires Azure-specific libraries).
 * Always returns undefined.
 */
export function getTcgcLroMetadata<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  operation: Operation,
  client: SdkClientType<TServiceOperation>,
): undefined {
  return undefined;
}

export function getActualClientType(client: SdkClient): Namespace | Interface {
  if (client.type) return client.type;
  // For merged multi-service sub clients where type is cleared or sub client created by string client location, fall back to the first service
  return client.services[0];
}

export function isSameServers(left: HttpServer[], right: HttpServer[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i++) {
    if (left[i].url !== right[i].url) {
      return false;
    }
  }
  return true;
}

export function isSameAuth(left: Authentication, right: Authentication): boolean {
  if (left.options.length !== right.options.length) {
    return false;
  }
  for (let i = 0; i < left.options.length; i++) {
    if (left.options[i].schemes.length !== right.options[i].schemes.length) {
      return false;
    }
    for (let j = 0; j < left.options[i].schemes.length; j++) {
      const leftScheme = left.options[i].schemes[j];
      const rightScheme = right.options[i].schemes[j];
      if (leftScheme.type !== rightScheme.type) {
        return false;
      }
      switch (leftScheme.type) {
        case "http":
          compilerAssert(rightScheme.type === "http", "Unexpected auth scheme type mismatch");
          if (leftScheme.scheme !== rightScheme.scheme) {
            return false;
          }
          break;
        case "apiKey":
          compilerAssert(rightScheme.type === "apiKey", "Unexpected auth scheme type mismatch");
          if (leftScheme.name !== rightScheme.name || leftScheme.in !== rightScheme.in) {
            return false;
          }
          break;
        case "oauth2":
          compilerAssert(rightScheme.type === "oauth2", "Unexpected auth scheme type mismatch");
          if (leftScheme.flows.length !== rightScheme.flows.length) {
            return false;
          }
          for (let k = 0; k < leftScheme.flows.length; k++) {
            const leftFlow = leftScheme.flows[k];
            const rightFlow = rightScheme.flows[k];
            if (leftFlow.type !== rightFlow.type) {
              return false;
            }
            if (leftFlow.scopes.length !== rightFlow.scopes.length) {
              return false;
            }
            for (let l = 0; l < leftFlow.scopes.length; l++) {
              if (leftFlow.scopes[l].value !== rightFlow.scopes[l].value) {
                return false;
              }
            }
            switch (leftFlow.type) {
              case "authorizationCode":
                compilerAssert(
                  rightFlow.type === "authorizationCode",
                  "Unexpected auth scheme type mismatch",
                );
                if (
                  leftFlow.authorizationUrl !== rightFlow.authorizationUrl ||
                  leftFlow.tokenUrl !== rightFlow.tokenUrl ||
                  leftFlow.refreshUrl !== rightFlow.refreshUrl
                ) {
                  return false;
                }
                break;
              case "clientCredentials":
                compilerAssert(
                  rightFlow.type === "clientCredentials",
                  "Unexpected auth scheme type mismatch",
                );
                if (
                  leftFlow.tokenUrl !== rightFlow.tokenUrl ||
                  leftFlow.refreshUrl !== rightFlow.refreshUrl
                ) {
                  return false;
                }
                break;
              case "implicit":
                compilerAssert(
                  rightFlow.type === "implicit",
                  "Unexpected auth scheme type mismatch",
                );
                if (
                  leftFlow.authorizationUrl !== rightFlow.authorizationUrl ||
                  leftFlow.refreshUrl !== rightFlow.refreshUrl
                ) {
                  return false;
                }
                break;
              case "password":
                compilerAssert(
                  rightFlow.type === "password",
                  "Unexpected auth scheme type mismatch",
                );
                if (
                  leftFlow.authorizationUrl !== rightFlow.authorizationUrl ||
                  leftFlow.refreshUrl !== rightFlow.refreshUrl
                ) {
                  return false;
                }
                break;
            }
          }
          break;
        case "openIdConnect":
          compilerAssert(
            rightScheme.type === "openIdConnect",
            "Unexpected auth scheme type mismatch",
          );
          if (leftScheme.openIdConnectUrl !== rightScheme.openIdConnectUrl) {
            return false;
          }
          break;
      }
    }
  }
  return true;
}

export function isTypeNeedsHandling(context: TCGCContext, type: Type): boolean {
  return (
    (context.__mutatedRealm === undefined && !unsafe_Realm.realmForType.has(type)) ||
    (context.__mutatedRealm !== undefined && context.__mutatedRealm.hasType(type))
  );
}

export function listOrphanTypes(context: TCGCContext): (Model | Enum | Union)[] {
  if (context.__orphanTypesCache) return context.__orphanTypesCache;
  const result: (Model | Enum | Union)[] = [];
  const userDefinedNamespaces = listAllUserDefinedNamespaces(context);
  for (const currNamespace of userDefinedNamespaces) {
    const namespaces = [currNamespace];
    let currentIndex = 0;
    while (currentIndex < namespaces.length) {
      const namespace = namespaces[currentIndex];
      // orphan models
      for (const model of namespace.models.values()) {
        if (isTemplateDeclaration(model)) continue;
        if (!getUsageOverride(context, model) && !getLegacyHierarchyBuilding(context, model))
          continue;
        result.push(model);
      }
      // orphan enums
      for (const enumType of namespace.enums.values()) {
        if (!getUsageOverride(context, enumType)) continue;
        result.push(enumType);
      }
      // orphan unions
      for (const unionType of namespace.unions.values()) {
        if (isTemplateDeclaration(unionType)) continue;
        if (!getUsageOverride(context, unionType)) continue;
        result.push(unionType);
      }
      namespaces.push(...namespace.namespaces.values());
      currentIndex++;
    }
  }
  context.__orphanTypesCache = result;
  return result;
}
