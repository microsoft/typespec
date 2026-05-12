import {
  compilerAssert,
  DecoratorContext,
  DecoratorFunction,
  DiagnosticTarget,
  Enum,
  EnumMember,
  getDiscriminator,
  getNamespaceFullName,
  ignoreDiagnostics,
  Interface,
  isErrorModel,
  isList,
  isNumeric,
  Model,
  ModelProperty,
  Namespace,
  Numeric,
  Operation,
  Program,
  RekeyableMap,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";
import { SyntaxKind, type Node } from "@typespec/compiler/ast";
import { $ } from "@typespec/compiler/typekit";
import {
  getAuthentication,
  getHttpOperation,
  getServers,
  isBody,
  isBodyRoot,
} from "@typespec/http";
import { resolveVersions } from "@typespec/versioning";
import {
  AccessDecorator,
  AlternateTypeDecorator,
  ApiVersionDecorator,
  ClientApiVersionsDecorator,
  ClientDecorator,
  ClientDocDecorator,
  ClientInitializationDecorator,
  ClientNameDecorator,
  ClientNamespaceDecorator,
  ClientOptionDecorator,
  ConvenientAPIDecorator,
  DeserializeEmptyStringAsNullDecorator,
  OperationGroupDecorator,
  ParamAliasDecorator,
  ProtocolAPIDecorator,
  ResponseAsBoolDecorator,
  ScopeDecorator,
  UsageDecorator,
} from "../generated-defs/TypeSpec.ClientGenerator.Core.js";
import {
  ClientDefaultValueDecorator,
  DisablePageableDecorator,
  FlattenPropertyDecorator,
  HierarchyBuildingDecorator,
  MarkAsLroDecorator,
  MarkAsPageableDecorator,
  NextLinkVerbDecorator,
} from "../generated-defs/TypeSpec.ClientGenerator.Core.Legacy.js";
import {
  AccessFlags,
  ClientInitializationOptions,
  ExternalTypeInfo,
  LanguageScopes,
  SdkClient,
  TCGCContext,
  UsageFlags,
} from "./interfaces.js";
import {
  AllScopes,
  clientKey,
  clientLocationKey,
  clientNameKey,
  clientNamespaceKey,
  compareModelProperties,
  findEntriesWithTarget,
  findRootSourceProperty,
  getScopedDecoratorData,
  isSameAuth,
  isSameServers,
  legacyHierarchyBuildingKey,
  listAllUserDefinedNamespaces,
  negationScopesKey,
  omitOperation,
  overrideKey,
  parseScopes,
  scopeKey,
  usageKey,
} from "./internal-utils.js";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
import { getSdkEnum, getSdkModel, getSdkUnion } from "./types.js";

export const namespace = "TypeSpec.ClientGenerator.Core";

function setScopedDecoratorData(
  context: DecoratorContext,
  decorator: DecoratorFunction,
  key: symbol,
  target: Type,
  value: unknown,
  scope?: LanguageScopes,
) {
  const targetEntry = context.program.stateMap(key).get(target);
  // if no scope specified, then set with the new value
  if (!scope) {
    if (targetEntry && targetEntry[AllScopes]) {
      targetEntry[AllScopes] = value;
    } else {
      const newObject = Object.fromEntries([[AllScopes, value]]);
      context.program
        .stateMap(key)
        .set(target, !targetEntry ? newObject : { ...targetEntry, ...newObject });
    }
    return;
  }

  const [negationScopes, scopes] = parseScopes(scope);
  if (negationScopes !== undefined && negationScopes.length > 0) {
    // override the previous value for negation scopes
    const newObject: Record<string | symbol, any> =
      scopes !== undefined && scopes.length > 0
        ? Object.fromEntries([AllScopes, ...scopes].map((scope) => [scope, value]))
        : Object.fromEntries([[AllScopes, value]]);
    newObject[negationScopesKey] = negationScopes;
    context.program.stateMap(key).set(target, newObject);

    // if a scope exists in the target entry and it overlaps with the negation scope, it means negation scope doesn't override it
    if (targetEntry !== undefined) {
      const existingScopes = Object.getOwnPropertyNames(targetEntry);
      const intersections = existingScopes.filter((x) => negationScopes.includes(x));
      if (intersections !== undefined && intersections.length > 0) {
        for (const scopeToKeep of intersections) {
          newObject[scopeToKeep] = targetEntry[scopeToKeep];
        }
      }
    }
  } else if (scopes !== undefined && scopes.length > 0) {
    // for normal scopes, add them incrementally
    const newObject = Object.fromEntries(scopes.map((scope) => [scope, value]));
    context.program
      .stateMap(key)
      .set(target, !targetEntry ? newObject : { ...targetEntry, ...newObject });
  }
}

export const $client: ClientDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface,
  options?: Type,
  scope?: LanguageScopes,
) => {
  if ((context.decoratorTarget as Node).kind === SyntaxKind.AugmentDecoratorStatement) {
    reportDiagnostic(context.program, {
      code: "wrong-client-decorator",
      target: context.decoratorTarget,
    });
    return;
  }
  const explicitName =
    options?.kind === "Model" ? options?.properties.get("name")?.type : undefined;
  const name: string = explicitName?.kind === "String" ? explicitName.value : target.name;
  let services: Namespace[];
  const serviceConfig =
    options?.kind === "Model" ? options?.properties.get("service")?.type : undefined;
  const autoMergeServiceConfig =
    options?.kind === "Model" ? options?.properties.get("autoMergeService")?.type : undefined;

  if (serviceConfig?.kind === "Namespace") {
    // Explicit single service
    services = [serviceConfig];
  } else if (
    serviceConfig?.kind === "Tuple" &&
    serviceConfig.values.every((v) => v.kind === "Namespace")
  ) {
    // Explicit multiple services
    if (target.kind === "Interface") {
      reportDiagnostic(context.program, {
        code: "invalid-client-service-multiple",
        target: context.decoratorTarget,
      });
      return;
    }
    services = serviceConfig.values;
    // validate all services has same server definition
    let servers = undefined;
    let auth = undefined;
    let isSame = true;
    for (const svc of services) {
      const currentServers = getServers(context.program, svc);
      if (currentServers === undefined) continue;
      if (servers === undefined) {
        servers = currentServers;
      } else {
        isSame = isSameServers(servers, currentServers);
        if (!isSame) {
          break;
        }
      }
    }
    for (const svc of services) {
      const currentAuth = getAuthentication(context.program, svc);
      if (currentAuth === undefined) continue;
      if (auth === undefined) {
        auth = currentAuth;
      } else {
        isSame = isSameAuth(auth, currentAuth);
        if (!isSame) {
          break;
        }
      }
    }
    if (!isSame) {
      reportDiagnostic(context.program, {
        code: "inconsistent-multiple-service",
        target: context.decoratorTarget,
      });
      return;
    }
    // For clients merging multiple services, ensure all services agree on the
    // version of any shared library dependency (e.g. ARM common-types).
    // Diverging versions cause TCGC to emit duplicated/diverged models.
    validateMultipleServiceDependencyVersions(
      context.program,
      name,
      services,
      context.decoratorTarget,
    );
  } else {
    // No explicit service - store empty array. Cache.ts will either:
    // - inherit from parent client (if nested)
    // - report an error (if root client)
    services = [];
  }

  const client: SdkClient = {
    kind: "SdkClient",
    name,
    services,
    type: target,
    subClients: [],
    clientPath: name,
    autoMergeService:
      autoMergeServiceConfig?.kind === "Boolean" ? autoMergeServiceConfig.value : false,
  };
  setScopedDecoratorData(context, $client, clientKey, target, client, scope);
};

/**
 * Validate that all services merged into the same client agree on the version
 * of every shared library dependency. Diverging versions silently produce
 * duplicated/diverged models in the generated SDK.
 */
function validateMultipleServiceDependencyVersions(
  program: Program,
  clientName: string,
  services: Namespace[],
  target: DiagnosticTarget,
): void {
  // For each shared dependency namespace, collect the set of versions picked
  // across all merged services.
  const depVersions = new Map<Namespace, Set<string>>();
  const serviceSet: ReadonlySet<Namespace> = new Set<Namespace>(services);

  for (const service of services) {
    const resolutions = resolveVersions(program, service);
    if (resolutions.length === 0) continue;
    // Use the latest resolved version of this service (matches what TCGC picks).
    for (const [depNs, depVersion] of resolutions[resolutions.length - 1].versions) {
      // Ignore versions of the merged services themselves.
      if (serviceSet.has(depNs)) continue;
      const versions = depVersions.get(depNs) ?? new Set<string>();
      versions.add(depVersion.value ?? depVersion.name);
      depVersions.set(depNs, versions);
    }
  }

  // Report any dependency that resolved to more than one version.
  for (const [depNs, versions] of depVersions) {
    if (versions.size <= 1) continue;
    reportDiagnostic(program, {
      code: "inconsistent-multiple-service-dependency",
      format: {
        clientName,
        dependencyName: getNamespaceFullName(depNs),
        versions: [...versions].map((v) => `"${v}"`).join(", "),
      },
      target,
    });
  }
}

/**
 * Return the client object for the given namespace or interface, or undefined if the given namespace or interface is not a client.
 *
 * @param context TCGCContext
 * @param type Type to check
 * @returns Client or undefined
 */
export function getClient(
  context: TCGCContext,
  type: Namespace | Interface,
): SdkClient | undefined {
  return context.getClient(type);
}

/**
 * List all the root clients.
 *
 * @param context TCGCContext
 * @returns Array of root clients
 */
export function listClients(context: TCGCContext): SdkClient[] {
  return context.getRootClients();
}

/**
 * @deprecated Use `@client` instead. The `@operationGroup` decorator is deprecated.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export const $operationGroup: OperationGroupDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface,
  scope?: LanguageScopes,
) => {
  // Delegate to $client - @operationGroup is now just an alias for @client
  context.call($client, target, undefined, scope);
};

/**
 * List all the sub clients inside a client. If ignoreHierarchy is true, the result will include all nested sub clients.
 *
 * @param context TCGCContext
 * @param group Client to list sub clients
 * @param ignoreHierarchy Whether to get all nested sub clients
 * @returns Array of sub clients
 */
export function listSubClients(
  context: TCGCContext,
  group: SdkClient,
  ignoreHierarchy = false,
): SdkClient[] {
  if (!ignoreHierarchy) return group.subClients;

  const clients: SdkClient[] = [...group.subClients];
  let current = 0;
  while (current < clients.length) {
    const subClient = clients[current];
    if (subClient.subClients) {
      clients.push(...subClient.subClients);
    }
    current++;
  }

  return clients;
}

/**
 * List operations inside a client or sub client. If ignoreHierarchy is true, the result will include all nested operations.
 * @param context TCGCContext
 * @param client Client to list operations
 * @param ignoreHierarchy Whether to get all nested operations
 * @returns
 */
export function listOperationsInClient(
  context: TCGCContext,
  client: SdkClient,
  ignoreHierarchy = false,
): Operation[] {
  if (!ignoreHierarchy) return context.getOperationsForClient(client);

  const subClients: SdkClient[] = [...client.subClients];
  const operations: Operation[] = [...context.getOperationsForClient(client)];
  let groupIdx = 0;
  while (groupIdx < subClients.length) {
    const subClient = subClients[groupIdx++];
    if (subClient.subClients) {
      subClients.push(...subClient.subClients);
    }
    operations.push(...context.getOperationsForClient(subClient));
  }

  return operations;
}

const protocolAPIKey = createStateSymbol("protocolAPI");

export const $protocolAPI: ProtocolAPIDecorator = (
  context: DecoratorContext,
  entity: Operation | Namespace | Interface,
  value?: boolean,
  scope?: LanguageScopes,
) => {
  setScopedDecoratorData(context, $protocolAPI, protocolAPIKey, entity, value, scope);
};

const convenientAPIKey = createStateSymbol("convenientAPI");

export const $convenientAPI: ConvenientAPIDecorator = (
  context: DecoratorContext,
  entity: Operation | Namespace | Interface,
  value?: boolean,
  scope?: LanguageScopes,
) => {
  setScopedDecoratorData(context, $convenientAPI, convenientAPIKey, entity, value, scope);
};

function getConvenientOrProtocolValue(
  context: TCGCContext,
  key: symbol,
  entity: Operation,
): boolean | undefined {
  // First check if the operation itself has the decorator
  const value = getScopedDecoratorData(context, key, entity);
  if (value !== undefined) {
    return value;
  }

  // Check the parent interface if the operation is in an interface
  if (entity.interface) {
    const interfaceValue = getScopedDecoratorData(context, key, entity.interface);
    if (interfaceValue !== undefined) {
      return interfaceValue;
    }
  }

  // Check the parent namespace hierarchy
  let currentNamespace: Namespace | undefined = entity.namespace;
  while (currentNamespace) {
    const namespaceValue = getScopedDecoratorData(context, key, currentNamespace);
    if (namespaceValue !== undefined) {
      return namespaceValue;
    }
    currentNamespace = currentNamespace.namespace;
  }

  return undefined;
}

export function shouldGenerateProtocol(context: TCGCContext, entity: Operation): boolean {
  const value = getConvenientOrProtocolValue(context, protocolAPIKey, entity);
  return value ?? Boolean(context.generateProtocolMethods);
}

export function shouldGenerateConvenient(context: TCGCContext, entity: Operation): boolean {
  const value = getConvenientOrProtocolValue(context, convenientAPIKey, entity);
  return value ?? Boolean(context.generateConvenienceMethods);
}

export const $usage: UsageDecorator = (
  context: DecoratorContext,
  entity: Model | Enum | Union | Namespace,
  value: EnumMember | Union,
  scope?: LanguageScopes,
) => {
  const isValidValue = (value: number): boolean => {
    // Allow the new usage values: input(2), output(4), json(256), xml(512)
    return (
      value === UsageFlags.Input ||
      value === UsageFlags.Output ||
      value === UsageFlags.Json ||
      value === UsageFlags.Xml
    );
  };

  let newUsage = 0;

  if (value.kind === "EnumMember") {
    if (typeof value.value === "number" && isValidValue(value.value)) {
      newUsage = value.value;
    } else {
      reportDiagnostic(context.program, {
        code: "invalid-usage",
        format: {},
        target: entity,
      });
      return;
    }
  } else {
    for (const variant of value.variants.values()) {
      if (variant.type.kind === "EnumMember" && typeof variant.type.value === "number") {
        if (isValidValue(variant.type.value)) {
          newUsage |= variant.type.value;
        }
      } else {
        reportDiagnostic(context.program, {
          code: "invalid-usage",
          format: {},
          target: entity,
        });
        return;
      }
    }

    if (newUsage === 0) {
      reportDiagnostic(context.program, {
        code: "invalid-usage",
        format: {},
        target: entity,
      });
      return;
    }
  }

  // Get existing usage and combine with new usage (additive behavior)
  const existingUsage = getScopedDecoratorData(context as any, usageKey, entity) || 0;
  const combinedUsage = existingUsage | newUsage;

  setScopedDecoratorData(context, $usage, usageKey, entity, combinedUsage, scope);
};

export function getUsageOverride(
  context: TCGCContext,
  entity: Model | Enum | Union,
): number | undefined {
  const usageFlags = getScopedDecoratorData(context, usageKey, entity);
  if (usageFlags || entity.namespace === undefined) return usageFlags;
  return getScopedDecoratorData(context, usageKey, entity.namespace);
}

export function getUsage(context: TCGCContext, entity: Model | Enum | Union): UsageFlags {
  switch (entity.kind) {
    case "Union":
      const type = getSdkUnion(context, entity);
      if (type.kind === "enum" || type.kind === "union" || type.kind === "nullable") {
        return type.usage;
      }
      return UsageFlags.None;
    case "Model":
      return getSdkModel(context, entity).usage;
    case "Enum":
      return getSdkEnum(context, entity).usage;
  }
}

const accessKey = createStateSymbol("access");

export const $access: AccessDecorator = (
  context: DecoratorContext,
  entity: Model | Enum | Operation | Union | Namespace | ModelProperty,
  value: EnumMember,
  scope?: LanguageScopes,
) => {
  if (typeof value.value !== "string" || (value.value !== "public" && value.value !== "internal")) {
    reportDiagnostic(context.program, {
      code: "invalid-access",
      format: {},
      target: entity,
    });
    return;
  }
  setScopedDecoratorData(context, $access, accessKey, entity, value.value, scope);
};

export function getAccessOverride(
  context: TCGCContext,
  entity: Model | Enum | Operation | Union | Namespace | ModelProperty,
): AccessFlags | undefined {
  const accessOverride = getScopedDecoratorData(context, accessKey, entity);

  if (!accessOverride && entity.kind !== "ModelProperty" && entity.namespace) {
    return getAccessOverride(context, entity.namespace);
  }

  return accessOverride;
}

export function getAccess(
  context: TCGCContext,
  entity: Model | Enum | Operation | Union | ModelProperty,
) {
  const override = getAccessOverride(context, entity);
  if (override || entity.kind === "Operation" || entity.kind === "ModelProperty") {
    return override || "public";
  }

  switch (entity.kind) {
    case "Model":
      return getSdkModel(context, entity).access;
    case "Enum":
      return getSdkEnum(context, entity).access;
    case "Union": {
      const type = getSdkUnion(context, entity);
      if (type.kind === "enum" || type.kind === "union" || type.kind === "nullable") {
        return type.access;
      }
      return "public";
    }
  }
}

const flattenPropertyKey = createStateSymbol("flattenProperty");
/**
 * Whether a model property should be flattened.
 *
 * @param context DecoratorContext
 * @param target ModelProperty to mark as flattened
 * @param scope Names of the projection (e.g. "python", "csharp", "java", "javascript")
 */
export const $flattenProperty: FlattenPropertyDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  scope?: LanguageScopes,
) => {
  if (getDiscriminator(context.program, target.type)) {
    reportDiagnostic(context.program, {
      code: "flatten-polymorphism",
      format: {},
      target: target,
    });
    return;
  }
  setScopedDecoratorData(context, $flattenProperty, flattenPropertyKey, target, true, scope);
};

/**
 * Whether a model property should be flattened or not.
 *
 * @param context TCGCContext
 * @param target ModelProperty that we want to check whether it should be flattened or not
 * @returns whether the model property should be flattened or not
 */
export function shouldFlattenProperty(context: TCGCContext, target: ModelProperty): boolean {
  return getScopedDecoratorData(context, flattenPropertyKey, target) ?? false;
}

export const $clientName: ClientNameDecorator = (
  context: DecoratorContext,
  entity: Type,
  value: string,
  scope?: LanguageScopes,
) => {
  // workaround for current lack of functionality in compiler
  // https://github.com/microsoft/typespec/issues/2717
  if (entity.kind === "Model" || entity.kind === "Operation") {
    const target = context.decoratorTarget as Node;
    if (target.kind === SyntaxKind.AugmentDecoratorStatement) {
      if (
        (
          ignoreDiagnostics(
            (context.program.checker as any).resolveTypeReference(target.targetType),
          ) as any
        )?.node !== entity.node
      ) {
        return;
      }
    }
    if (target.kind === SyntaxKind.DecoratorExpression) {
      if (target.parent !== entity.node) {
        return;
      }
    }
  }
  if (value.trim() === "") {
    reportDiagnostic(context.program, {
      code: "empty-client-name",
      format: {},
      target: entity,
    });
    return;
  }
  setScopedDecoratorData(context, $clientName, clientNameKey, entity, value, scope);
};

export function getClientNameOverride(
  context: TCGCContext,
  entity: Type,
  languageScope?: string | typeof AllScopes,
): string | undefined {
  return getScopedDecoratorData(context, clientNameKey, entity, languageScope);
}

// Recursive function to collect parameter names
function collectParams(
  program: Program,
  properties: RekeyableMap<string, ModelProperty>,
  params: ModelProperty[] = [],
): ModelProperty[] {
  properties.forEach((value, key) => {
    // If the property is of type 'model', recurse into its properties
    if (!params.some((x) => compareModelProperties(program, x, value))) {
      if (value.type.kind === "Model") {
        collectParams(program, value.type.properties, params);
      } else {
        params.push(findRootSourceProperty(value));
      }
    }
  });

  return params;
}

export const $override = (
  context: DecoratorContext,
  original: Operation,
  override: Operation,
  scope?: LanguageScopes,
) => {
  // omit all override operation
  context.program.stateMap(omitOperation).set(override, true);

  // Extract and sort parameter names
  const originalParams = collectParams(context.program, original.parameters.properties).sort(
    (a, b) => a.name.localeCompare(b.name),
  );
  const overrideParams = collectParams(context.program, override.parameters.properties).sort(
    (a, b) => a.name.localeCompare(b.name),
  );

  // Check if the sorted parameter names arrays are equal, omit optional parameters
  let parametersMatch = true;
  let checkParameter: ModelProperty | undefined = undefined;
  let index = 0;
  for (const originalParam of originalParams) {
    if (index > overrideParams.length - 1) {
      if (!originalParam.optional) {
        parametersMatch = false;
        checkParameter = originalParam;
        break;
      } else {
        continue;
      }
    }
    if (!compareModelProperties(context.program, originalParam, overrideParams[index])) {
      if (!originalParam.optional) {
        parametersMatch = false;
        checkParameter = originalParam;
        break;
      } else {
        continue;
      }
    }

    // Apply the alternate type to the original parameter
    const overrideParam = overrideParams[index];
    overrideParam.decorators
      .filter(
        (d) =>
          d.definition?.name === "@alternateType" &&
          getNamespaceFullName(d.definition?.namespace) === namespace,
      )
      .map((d) =>
        context.call(
          $alternateType,
          originalParam,
          d.args[0].value as Type,
          d.args[1]?.jsValue as string | undefined,
        ),
      );

    index++;
  }

  if (!parametersMatch) {
    reportDiagnostic(context.program, {
      code: "override-parameters-mismatch",
      target: context.decoratorTarget,
      format: {
        methodName: original.name,
        checkParameter: checkParameter?.name ?? "",
      },
    });
  }
  setScopedDecoratorData(context, $override, overrideKey, original, override, scope);
};

/**
 * Gets additional information on how to serialize / deserialize TYPESPEC standard types depending
 * on whether additional serialization information is provided or needed
 *
 * @param context the Sdk Context
 * @param entity the entity whose client format we are going to get
 * @returns the format in which to serialize the typespec type or undefined
 */
export function getOverriddenClientMethod(
  context: TCGCContext,
  entity: Operation,
): Operation | undefined {
  return getScopedDecoratorData(context, overrideKey, entity);
}

/**
 * Check if a model is an external type.
 * The external type model has properties: identity (required), package (optional), minVersion (optional).
 */
function isExternalType(model: Model): boolean {
  if (model.indexer !== undefined) {
    return false;
  }

  const properties = [...model.properties.values()];

  // Check if it has an 'identity' property with String literal type
  const hasIdentity = properties.some(
    (prop) => prop.name === "identity" && prop.type.kind === "String",
  );

  if (!hasIdentity) {
    return false;
  }

  // Check that all other properties are only 'package' or 'minVersion' with String literal types
  const otherProps = properties.filter((prop) => prop.name !== "identity");
  const validProps = otherProps.every(
    (prop) =>
      (prop.name === "package" || prop.name === "minVersion") && prop.type.kind === "String",
  );

  return validProps;
}

const alternateTypeKey = createStateSymbol("alternateType");

/**
 * Replace a source type with an alternate type in a specific scope.
 *
 * @param context the decorator context
 * @param source source type to be replaced
 * @param alternate target type to replace the source type or ExternalType object
 * @param scope Names of the projection (e.g. "python", "csharp", "java", "javascript")
 */
export const $alternateType: AlternateTypeDecorator = (
  context: DecoratorContext,
  source: ModelProperty | Scalar | Model | Enum | Union,
  alternate: Type,
  scope?: LanguageScopes,
) => {
  let alternateInput: Type | ExternalTypeInfo = alternate;
  if (alternate.kind === "Model" && isExternalType(alternate)) {
    // This means we're dealing with external type
    if (source.kind === "ModelProperty") {
      reportDiagnostic(context.program, {
        code: "external-type-on-model-property",
        target: source,
      });
      return;
    }
    if (!scope) {
      reportDiagnostic(context.program, {
        code: "missing-scope",
        format: {
          decoratorName: "@alternateType",
        },
        target: source,
      });
    }

    const alternatePropertyValues = [...alternate.properties.values()];
    // Get identity if needed
    const identity = alternatePropertyValues
      .filter((x) => x.name === "identity")
      .map((x) => x.type)
      .filter((x) => x.kind === "String")
      .map((x) => x.value)[0];

    const packageName = alternatePropertyValues
      .filter((x) => x.name === "package")
      .map((x) => x.type)
      .filter((x) => x.kind === "String")
      .map((x) => x.value)[0];

    const minVersion = alternatePropertyValues
      .filter((x) => x.name === "minVersion")
      .map((x) => x.type)
      .filter((x) => x.kind === "String")
      .map((x) => x.value)[0];

    alternateInput = {
      kind: "externalTypeInfo",
      identity,
      package: packageName,
      minVersion,
    };
  } else {
    // Not external type
    if (source.kind === "Scalar" && alternate.kind !== "Scalar") {
      reportDiagnostic(context.program, {
        code: "invalid-alternate-type",
        format: {
          kindName: alternate.kind,
        },
        target: alternate,
      });
      return;
    }
  }
  setScopedDecoratorData(context, $alternateType, alternateTypeKey, source, alternateInput, scope);
};

/**
 * Get the alternate type for a source type in a specific scope.
 *
 * @param context the Sdk Context
 * @param source source type to be replaced
 * @returns alternate type to replace the source type, or undefined if no alternate type is found
 */
export function getAlternateType(
  context: TCGCContext,
  source: ModelProperty | Scalar | Model | Enum | Union,
): Type | ExternalTypeInfo | undefined {
  const retval: Type | ExternalTypeInfo | undefined = getScopedDecoratorData(
    context,
    alternateTypeKey,
    source,
  );
  if (retval !== undefined && retval.kind === "externalTypeInfo") {
    if (!context.__externalPackageToVersions) {
      context.__externalPackageToVersions = new Map();
    }
    const externalPackage = retval.package;
    const externalMinVersion = retval.minVersion;
    if (externalPackage && externalMinVersion) {
      const existingVersion = context.__externalPackageToVersions.get(externalPackage);
      if (existingVersion && existingVersion !== externalMinVersion) {
        reportDiagnostic(context.program, {
          code: "external-library-version-mismatch",
          format: {
            libraryName: externalPackage,
            versionA: existingVersion,
            versionB: externalMinVersion,
          },
          target: source,
        });
      }
      context.__externalPackageToVersions.set(externalPackage, externalMinVersion);
    }
  }
  return retval;
}

export const $useSystemTextJsonConverter: DecoratorFunction = (
  context: DecoratorContext,
  entity: Model,
  scope?: LanguageScopes,
) => {};

const clientInitializationKey = createStateSymbol("clientInitialization");

export const $clientInitialization: ClientInitializationDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface,
  options: Type,
  scope?: LanguageScopes,
) => {
  if (options.kind === "Model") {
    if (options.properties.get("initializedBy")) {
      const value = options.properties.get("initializedBy")!.type;

      const isValidValue = (value: number): boolean => value === 4 || value === 1 || value === 2;

      if (value.kind === "EnumMember") {
        if (typeof value.value !== "number" || !isValidValue(value.value)) {
          reportDiagnostic(context.program, {
            code: "invalid-initialized-by",
            format: {
              message: "Please use `InitializedBy` enum to set the value.",
            },
            target: target,
          });
          return;
        }
      } else if (value.kind === "Union") {
        for (const variant of value.variants.values()) {
          if (
            variant.type.kind !== "EnumMember" ||
            typeof variant.type.value !== "number" ||
            !isValidValue(variant.type.value)
          ) {
            reportDiagnostic(context.program, {
              code: "invalid-initialized-by",
              format: {
                message: "Please use `InitializedBy` enum to set the value.",
              },
              target: target,
            });
            return;
          }
          if (variant.type.value === 4) {
            reportDiagnostic(context.program, {
              code: "invalid-initialized-by",
              format: {
                message: "`InitializedBy.customizeCode` cannot be combined with other values.",
              },
              target: target,
            });
            return;
          }
        }
      }
    }

    setScopedDecoratorData(
      context,
      $clientInitialization,
      clientInitializationKey,
      target,
      options,
      scope,
    );
  }
};

/**
 * Get client initialization options for namespace or interface. The info is from `@clientInitialization` decorator.
 *
 * @param context
 * @param entity namespace or interface which represents a client
 * @returns
 */
export function getClientInitializationOptions(
  context: TCGCContext,
  entity: Namespace | Interface,
): ClientInitializationOptions | undefined {
  const options = getScopedDecoratorData(context, clientInitializationKey, entity);

  // backward compatibility
  if (
    options &&
    options.properties.get("initializedBy") === undefined &&
    options.properties.get("parameters") === undefined
  ) {
    return {
      parameters: options,
    };
  }

  let initializedBy = undefined;

  if (options?.properties.get("initializedBy")) {
    if (options.properties.get("initializedBy").type.kind === "EnumMember") {
      initializedBy = options.properties.get("initializedBy").type.value;
    } else if (options.properties.get("initializedBy").type.kind === "Union") {
      initializedBy = 0;
      for (const variant of options.properties.get("initializedBy").type.variants.values()) {
        initializedBy |= variant.type.value;
      }
    }
  }

  let parametersModel = options?.properties.get("parameters")?.type;
  let currEntity: Namespace | Interface | undefined = entity;
  while (currEntity) {
    const movedParameters = findEntriesWithTarget<ModelProperty, Namespace | Interface>(
      context,
      clientLocationKey,
      currEntity,
      "ModelProperty",
    );
    const tk = $(context.program);
    if (movedParameters.length > 0) {
      if (parametersModel) {
        // If the parameters model already exists, we will merge the moved parameters into it.
        for (const movedParameter of movedParameters) {
          parametersModel.properties.set(movedParameter.name, movedParameter);
        }
      } else {
        parametersModel = tk.model.create({
          name: "ClientInitializationParameters",
          properties: {
            ...Object.fromEntries(
              movedParameters.map((movedParameter) => [movedParameter.name, movedParameter]),
            ),
          },
        });
      }
    }
    currEntity = currEntity.namespace;
  }

  return {
    parameters: parametersModel,
    initializedBy: initializedBy,
  };
}

const paramAliasKey = createStateSymbol("paramAlias");

export const $paramAlias: ParamAliasDecorator = (
  context: DecoratorContext,
  original: ModelProperty,
  paramAlias: string,
  scope?: LanguageScopes,
) => {
  const paramAliasDec = context.program.stateMap(paramAliasKey).get(original);
  const paramAliasVal = paramAliasDec?.[scope || AllScopes] ?? paramAliasDec?.[AllScopes];
  if (paramAliasVal) {
    reportDiagnostic(context.program, {
      code: "multiple-param-alias",
      format: {
        originalName: original.name,
        firstParamAlias: paramAliasVal,
      },
      target: context.decoratorTarget,
    });
    return;
  }
  setScopedDecoratorData(context, $paramAlias, paramAliasKey, original, paramAlias, scope);
};

export function getParamAlias(context: TCGCContext, original: ModelProperty): string | undefined {
  return getScopedDecoratorData(context, paramAliasKey, original);
}

const apiVersionKey = createStateSymbol("apiVersion");

export const $apiVersion: ApiVersionDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  value?: boolean,
  scope?: LanguageScopes,
) => {
  setScopedDecoratorData(context, $apiVersion, apiVersionKey, target, value ?? true, scope);
};

export function getIsApiVersion(context: TCGCContext, param: ModelProperty): boolean | undefined {
  return getScopedDecoratorData(context, apiVersionKey, param);
}

export const $clientNamespace: ClientNamespaceDecorator = (
  context: DecoratorContext,
  entity: Namespace | Interface | Model | Enum | Union,
  value: string,
  scope?: LanguageScopes,
) => {
  if (value.trim() === "") {
    reportDiagnostic(context.program, {
      code: "empty-client-namespace",
      format: {},
      target: entity,
    });
    return;
  }
  setScopedDecoratorData(context, $clientNamespace, clientNamespaceKey, entity, value, scope);
};

/**
 * Find the shortest namespace that overlaps with the override string.
 * @param override
 * @param userDefinedNamespaces
 * @returns
 */
function findNamespaceOverlapClosestToRoot(
  override: string,
  userDefinedNamespaces: Namespace[],
): Namespace | undefined {
  for (const namespace of userDefinedNamespaces) {
    if (override.includes(namespace.name)) {
      return namespace;
    }
  }

  return undefined;
}

/**
 * Returns the client namespace for a given entity. The order of operations is as follows:
 *
 * 1. If `@clientNamespace` is applied to the entity, this wins out.
 *    a. If the `--namespace` flag is passed in during generation, we will replace the root of the client namespace with the flag.
 * 2. If the `--namespace` flag is passed in, we treat that as the only namespace in the entire spec, and return that namespace.
 * 3. We return the namespace of the entity retrieved from the original spec.
 * @param context
 * @param entity
 * @returns
 */
export function getClientNamespace(
  context: TCGCContext,
  entity: Namespace | Interface | Model | Enum | Union,
): string {
  const override = getScopedDecoratorData(context, clientNamespaceKey, entity);
  if (override) {
    // if `@clientNamespace` is applied to the entity, this wins out
    // if the override matches or extends the namespace flag, no replacement is needed
    if (
      context.namespaceFlag &&
      (override === context.namespaceFlag || override.startsWith(context.namespaceFlag + "."))
    ) {
      return override;
    }
    const userDefinedNamespace = findNamespaceOverlapClosestToRoot(
      override,
      listAllUserDefinedNamespaces(context),
    );
    if (userDefinedNamespace && context.namespaceFlag) {
      // we still make sure to replace the root of the client namespace with the flag (if the flag exists)
      return override.replace(userDefinedNamespace.name, context.namespaceFlag);
    }
    return override;
  }
  if (!entity.namespace) {
    return "";
  }
  if (entity.kind === "Namespace") {
    return getNamespaceFullNameWithOverride(context, entity);
  }
  return getNamespaceFullNameWithOverride(context, entity.namespace);
}

function getNamespaceFullNameWithOverride(context: TCGCContext, namespace: Namespace): string {
  const segments = [];
  let current: Namespace | undefined = namespace;
  let isOverridden: boolean = false;
  while (current && current.name !== "") {
    const override = getScopedDecoratorData(context, clientNamespaceKey, current);
    if (override) {
      segments.unshift(override);
      isOverridden = true;
      break;
    }
    segments.unshift(current.name);
    current = current.namespace;
  }
  const joinedSegments = segments.join(".");
  if (isOverridden) {
    // if it's overridden, and there's a `@clientNamespace` flag, we want to do the shortest namespace overlap replacement
    const userDefinedNamespace = findNamespaceOverlapClosestToRoot(
      joinedSegments,
      listAllUserDefinedNamespaces(context),
    );
    if (userDefinedNamespace && context.namespaceFlag) {
      // Check if replacement would cause duplication:
      // This happens when the namespace flag is an extension of the user-defined namespace
      // and joinedSegments already starts with the flag (meaning override already applied it)
      if (
        context.namespaceFlag.startsWith(userDefinedNamespace.name) &&
        (joinedSegments.startsWith(context.namespaceFlag + ".") ||
          joinedSegments === context.namespaceFlag)
      ) {
        return joinedSegments;
      }
      return joinedSegments.replace(userDefinedNamespace.name, context.namespaceFlag);
    }
    return joinedSegments;
  }
  if (context.namespaceFlag) return context.namespaceFlag;
  return joinedSegments;
}

export const $scope: ScopeDecorator = (
  context: DecoratorContext,
  entity: Operation | ModelProperty,
  scope?: LanguageScopes,
) => {
  const [negationScopes, scopes] = parseScopes(scope);
  if (negationScopes !== undefined && negationScopes.length > 0) {
    // for negation scope, override the previous value
    setScopedDecoratorData(context, $scope, negationScopesKey, entity, negationScopes);
  }
  if (scopes !== undefined && scopes.length > 0) {
    // for normal scope, add them incrementally
    const targetEntry = context.program.stateMap(scopeKey).get(entity);
    setScopedDecoratorData(
      context,
      $scope,
      scopeKey,
      entity,
      !targetEntry ? scopes : [...Object.values(targetEntry), ...scopes],
    );
  }
};

const clientApiVersionsKey = createStateSymbol("clientApiVersions");

/**
 * Add additional api versions that are possible for the client to use.
 *
 * @param context
 * @param target Service namespace that has these additional api versions
 * @param value Enum with the additional api versions
 * @param scope
 */
export const $clientApiVersions: ClientApiVersionsDecorator = (
  context: DecoratorContext,
  target: Namespace,
  value: Enum,
  scope?: LanguageScopes,
) => {
  setScopedDecoratorData(context, $clientApiVersions, clientApiVersionsKey, target, value, scope);
};

/**
 * Get the explicit client api versions that are possible for the client to use denoted by `@clientApiVersions`
 *
 * @param context
 * @param target
 * @returns
 */
export function getExplicitClientApiVersions(
  context: TCGCContext,
  target: Namespace,
): Enum | undefined {
  return getScopedDecoratorData(context, clientApiVersionsKey, target);
}
export const $deserializeEmptyStringAsNull: DeserializeEmptyStringAsNullDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  scope?: LanguageScopes,
) => {
  if (target.type.kind !== "Scalar") {
    reportDiagnostic(context.program, {
      code: "invalid-deserializeEmptyStringAsNull-target-type",
      format: {},
      target: target,
    });
    return;
  }

  if (target.type.name !== "string") {
    let scalarType = target.type as Scalar;
    while (scalarType.baseScalar !== undefined) {
      scalarType = scalarType.baseScalar;
    }

    if (scalarType.name !== "string") {
      reportDiagnostic(context.program, {
        code: "invalid-deserializeEmptyStringAsNull-target-type",
        format: {},
        target: target,
      });
      return;
    }
  }
};

const responseAsBoolKey = createStateSymbol("responseAsBool");

export const $responseAsBool: ResponseAsBoolDecorator = (
  context: DecoratorContext,
  target: Operation,
  scope?: LanguageScopes,
) => {
  if (!target.decorators.some((d) => d.definition?.name === "@head")) {
    reportDiagnostic(context.program, {
      code: "non-head-bool-response-decorator",
      format: {
        operationName: target.name,
      },
      target: target,
    });
    return;
  }
  setScopedDecoratorData(context, $responseAsBool, responseAsBoolKey, target, true, scope);
};

export function getResponseAsBool(context: TCGCContext, target: Operation): boolean {
  return getScopedDecoratorData(context, responseAsBoolKey, target);
}

const clientDocKey = createStateSymbol("clientDoc");

/**
 * Type representing the client documentation data stored.
 */
interface ClientDocData {
  documentation: string;
  mode: string;
}

export const $clientDoc: ClientDocDecorator = (
  context: DecoratorContext,
  target: Type,
  documentation: string,
  mode: EnumMember,
  scope?: LanguageScopes,
) => {
  const docMode = mode.value as string;
  // Validate the mode value
  if (docMode !== "append" && docMode !== "replace") {
    reportDiagnostic(context.program, {
      code: "invalid-client-doc-mode",
      format: { mode: docMode },
      target: context.decoratorTarget,
    });
    return;
  }

  const docData: ClientDocData = {
    documentation,
    mode: docMode,
  };

  setScopedDecoratorData(context, $clientDoc, clientDocKey, target, docData, scope);
};

/**
 * Gets the client documentation data for a type.
 *
 * @param context TCGCContext
 * @param target Type to get client documentation for
 * @returns ClientDocData or undefined if no client documentation exists
 */
export function getClientDocExplicit(
  context: TCGCContext,
  target: Type,
): ClientDocData | undefined {
  return getScopedDecoratorData(context, clientDocKey, target);
}

export const $clientLocation = (
  context: DecoratorContext,
  source: Operation | ModelProperty,
  target: Interface | Namespace | Operation | string,
  scope?: LanguageScopes,
) => {
  if (source.kind === "Operation") {
    // can only move parameters to an operation, not another operation
    if (typeof target !== "string" && target.kind === "Operation") {
      reportDiagnostic(context.program, {
        code: "client-location-conflict",
        format: { operationName: source.name },
        target: context.decoratorTarget,
        messageId: "operationToOperation",
      });
      return;
    }
  } else if (source.kind === "ModelProperty") {
    // verify that there isn't a conflict with existing client initialization parameter
    if (
      typeof target !== "string" &&
      (target.kind === "Interface" || target.kind === "Namespace")
    ) {
      const clientInitializationParams = target.decorators
        .filter((d) => d.decorator.name === "$clientInitialization")
        .map((d) => d.args[0].value)
        .filter((a): a is Model => a.entityKind === "Type" && a.kind === "Model")
        .filter((model) => model.properties.has(source.name))
        .map((model) => model.properties.get(source.name)!);
      if (clientInitializationParams.length > 0) {
        reportDiagnostic(context.program, {
          code: "client-location-conflict",
          format: { parameterName: source.name },
          target: context.decoratorTarget,
          messageId: "modelPropertyToClientInitialization",
        });
        return;
      }
    }
    if (typeof target === "string") {
      reportDiagnostic(context.program, {
        code: "client-location-conflict",
        format: { parameterName: source.name },
        target: context.decoratorTarget,
        messageId: "modelPropertyToString",
      });
      return;
    }
  }
  setScopedDecoratorData(context, $clientLocation, clientLocationKey, source, target, scope);
};

/**
 * Gets the `Namespace`, `Interface` or name of client where an operation changes location to.
 */
export function getClientLocation(
  context: TCGCContext,
  input: Operation,
): Namespace | Interface | string | undefined;

/**
 * Gets the `Namespace`, `Interface`, `Operation` where a parameter changes location to.
 */
export function getClientLocation(
  context: TCGCContext,
  input: ModelProperty,
): Namespace | Interface | Operation | undefined;

/**
 * Gets the `Namespace`, `Interface`, `Operation` or name of client where an operation / parameter change the location to.
 *
 * @param context TCGCContext
 * @param input Operation or parameter to be moved
 * @returns `Namespace`, `Interface`, `Operation`, `string` target or undefined if no location change.
 */
export function getClientLocation(
  context: TCGCContext,
  input: Operation | ModelProperty,
): Namespace | Interface | Operation | string | undefined {
  return getScopedDecoratorData(context, clientLocationKey, input);
}

export const $legacyHierarchyBuilding: HierarchyBuildingDecorator = (
  context: DecoratorContext,
  target: Model,
  value: Model,
  scope?: LanguageScopes,
) => {
  setScopedDecoratorData(
    context,
    $legacyHierarchyBuilding,
    legacyHierarchyBuildingKey,
    target,
    value,
    scope,
  );
};

export function getLegacyHierarchyBuilding(context: TCGCContext, target: Model): Model | undefined {
  // If legacy hierarchy building is not respected, ignore the decorator completely
  if (!context.enableLegacyHierarchyBuilding) return undefined;

  return getScopedDecoratorData(context, legacyHierarchyBuildingKey, target);
}

const markAsLroKey = createStateSymbol("markAsLro");

export const $markAsLro: MarkAsLroDecorator = (
  context: DecoratorContext,
  target: Operation,
  scope?: LanguageScopes,
) => {
  const httpOperation = ignoreDiagnostics(getHttpOperation(context.program, target));
  const hasModelResponse = httpOperation.responses.filter(
    (r) =>
      r.type?.kind === "Model" && !(r.statusCodes === "*" || isErrorModel(context.program, r.type)),
  )[0];
  if (!hasModelResponse) {
    reportDiagnostic(context.program, {
      code: "invalid-mark-as-lro-target",
      format: {
        operation: target.name,
      },
      target: context.decoratorTarget,
    });
    return;
  }
  setScopedDecoratorData(context, $markAsLro, markAsLroKey, target, true, scope);
};

export function getMarkAsLro(context: TCGCContext, entity: Operation): boolean {
  return getScopedDecoratorData(context, markAsLroKey, entity) ?? false;
}

const markAsPageableKey = createStateSymbol("markAsPageable");

export const $markAsPageable: MarkAsPageableDecorator = (
  context: DecoratorContext,
  target: Operation,
  scope?: LanguageScopes,
) => {
  const httpOperation = ignoreDiagnostics(getHttpOperation(context.program, target));
  const modelResponse = httpOperation.responses.filter(
    (r) =>
      r.type?.kind === "Model" && !(r.statusCodes === "*" || isErrorModel(context.program, r.type)),
  )[0];
  if (!modelResponse) {
    reportDiagnostic(context.program, {
      code: "invalid-mark-as-pageable-target",
      format: {
        operation: target.name,
      },
      target: context.decoratorTarget,
    });
    return;
  }

  // Check if already marked with @list decorator
  if (isList(context.program, target)) {
    reportDiagnostic(context.program, {
      code: "mark-as-pageable-ineffective",
      format: {
        operation: target.name,
      },
      target: context.decoratorTarget,
    });
    return;
  }

  // Check the response model for @pageItems decorator
  const responseType = getRealResponseModel(context.program, modelResponse.type as Model);
  if (responseType.kind !== "Model") {
    reportDiagnostic(context.program, {
      code: "invalid-mark-as-pageable-target",
      format: {
        operation: target.name,
      },
      target: context.decoratorTarget,
    });
    return;
  }

  // Check if any property has @pageItems decorator by checking the program state
  // The @pageItems decorator uses a state symbol "TypeSpec.pageItems"
  const pageItemsStateKey = Symbol.for("TypeSpec.pageItems");
  let itemsProperty: ModelProperty | undefined = undefined;
  for (const [, prop] of responseType.properties) {
    if (context.program.stateSet(pageItemsStateKey).has(prop)) {
      itemsProperty = prop;
      break;
    }
  }

  if (!itemsProperty) {
    // Try to find a property named "value"
    itemsProperty = responseType.properties.get("value");
    if (!itemsProperty) {
      // No @pageItems property and no "value" property found
      reportDiagnostic(context.program, {
        code: "invalid-mark-as-pageable-target",
        format: {
          operation: target.name,
        },
        target: context.decoratorTarget,
      });
      return;
    }
  }

  // Store metadata that will be checked by TCGC to treat this operation as pageable
  setScopedDecoratorData(
    context,
    $markAsPageable,
    markAsPageableKey,
    target,
    { itemsProperty },
    scope,
  );
};

export function getMarkAsPageable(
  context: TCGCContext,
  entity: Operation,
): MarkAsPageableInfo | undefined {
  return getScopedDecoratorData(context, markAsPageableKey, entity);
}

export interface MarkAsPageableInfo {
  itemsProperty: ModelProperty;
}

const disablePageableKey = createStateSymbol("disablePageable");

export const $disablePageable: DisablePageableDecorator = (
  context: DecoratorContext,
  target: Operation,
  scope?: LanguageScopes,
) => {
  setScopedDecoratorData(context, $disablePageable, disablePageableKey, target, true, scope);
};

export function getDisablePageable(context: TCGCContext, entity: Operation): boolean {
  return getScopedDecoratorData(context, disablePageableKey, entity) ?? false;
}

function getRealResponseModel(program: Program, responseModel: Model): Type {
  let bodyProperty: ModelProperty | undefined = undefined;
  for (const prop of responseModel.properties.values()) {
    if (isBody(program, prop) || isBodyRoot(program, prop)) {
      bodyProperty = prop;
      break;
    }
  }
  if (bodyProperty) {
    return bodyProperty.type;
  }
  return responseModel;
}

const nextLinkVerbKey = createStateSymbol("nextLinkVerb");

export const $nextLinkVerb: NextLinkVerbDecorator = (
  context: DecoratorContext,
  target: Operation,
  verb: Type,
  scope?: LanguageScopes,
) => {
  compilerAssert(
    verb.kind === "String" && (verb.value === "POST" || verb.value === "GET"),
    "@nextLinkVerb decorator only supports 'POST' or 'GET' string literal values.",
  );
  setScopedDecoratorData(context, $nextLinkVerb, nextLinkVerbKey, target, verb.value, scope);
};

/**
 * Get the HTTP verb specified for next link operations in paging scenarios.
 * @param context TCGCContext
 * @param entity Operation to check for nextLinkVerb decorator
 * @returns The HTTP verb string ("POST" or "GET"). Defaults to "GET" if decorator is not applied.
 */
export function getNextLinkVerb(context: TCGCContext, entity: Operation): "GET" | "POST" {
  return getScopedDecoratorData(context, nextLinkVerbKey, entity) ?? "GET";
}

const clientDefaultValueKey = createStateSymbol("clientDefaultValue");

export const $clientDefaultValue: ClientDefaultValueDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  value: string | boolean | Numeric,
  scope?: LanguageScopes,
) => {
  const actualValue = isNumeric(value) ? value.asNumber() : value;
  setScopedDecoratorData(
    context,
    $clientDefaultValue,
    clientDefaultValueKey,
    target,
    actualValue,
    scope,
  );
};

/**
 * Get the client-level default value for a model property.
 * @param context TCGCContext
 * @param entity ModelProperty to check for clientDefaultValue decorator
 * @returns The client-level default value if decorator is applied, undefined otherwise.
 */
export function getClientDefaultValue(
  context: TCGCContext,
  entity: ModelProperty,
): string | boolean | Numeric | undefined {
  return getScopedDecoratorData(context, clientDefaultValueKey, entity);
}

/**
 * Check if an operation or model property is in scope for the current emitter.
 * @param context TCGCContext
 * @param entity Operation or ModelProperty to check if it is in scope
 * @returns
 */
export function isInScope(context: TCGCContext, entity: Operation | ModelProperty): boolean {
  const scopes = getScopedDecoratorData(context, scopeKey, entity);
  const negationScopes = getScopedDecoratorData(context, negationScopesKey, entity);

  if (scopes !== undefined) {
    if (scopes.includes(context.emitterName)) {
      return true;
    }

    if (negationScopes === undefined) {
      return false;
    }
  }

  if (negationScopes !== undefined && negationScopes.includes(context.emitterName)) {
    return false;
  }
  return true;
}

export const clientOptionKey = createStateSymbol("ClientOption");

/**
 * `@clientOption` decorator implementation.
 * Pass experimental flags or options to emitters without requiring TCGC reshipping.
 * The decorator data is stored as {name, value} and exposed via the decorators array.
 */
export const $clientOption: ClientOptionDecorator = (
  context: DecoratorContext,
  target: Type,
  name: string,
  value: unknown,
  scope?: LanguageScopes,
) => {
  // Always emit warning that this is experimental
  reportDiagnostic(context.program, {
    code: "client-option",
    target: context.decoratorTarget,
  });

  // Emit additional warning if scope is not provided
  if (scope === undefined) {
    reportDiagnostic(context.program, {
      code: "client-option-requires-scope",
      target: context.decoratorTarget,
    });
  }

  // Store the option data - each decorator application is stored separately
  // The decorator info will be exposed via the decorators array on SDK types
  setScopedDecoratorData(context, $clientOption, clientOptionKey, target, { name, value }, scope);
};

/**
 * Gets the value of a specific client option for a target.
 * Checks the target itself and walks up the namespace/interface hierarchy.
 */
export function getClientOptionValue(
  context: TCGCContext,
  target: Operation,
  optionName: string,
): unknown | undefined {
  // Check operation directly
  const opOption = getScopedDecoratorData(context, clientOptionKey, target) as
    | { name: string; value: unknown }
    | undefined;
  if (opOption?.name === optionName) {
    return opOption.value;
  }

  // Check interface if operation is in one
  if (target.interface) {
    const ifaceOption = getScopedDecoratorData(context, clientOptionKey, target.interface) as
      | { name: string; value: unknown }
      | undefined;
    if (ifaceOption?.name === optionName) {
      return ifaceOption.value;
    }
  }

  // Check namespace hierarchy
  let ns = target.namespace;
  while (ns) {
    const nsOption = getScopedDecoratorData(context, clientOptionKey, ns) as
      | { name: string; value: unknown }
      | undefined;
    if (nsOption?.name === optionName) {
      return nsOption.value;
    }
    ns = ns.namespace;
  }

  return undefined;
}

/**
 * Known client option: omitSlashFromEmptyRoute
 * When set to true, operations with empty routes ("/") will have their path set to "".
 */
export function shouldOmitSlashFromEmptyRoute(context: TCGCContext, target: Operation): boolean {
  return getClientOptionValue(context, target, "omitSlashFromEmptyRoute") === true;
}
