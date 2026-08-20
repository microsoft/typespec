import {
  getNamespaceFullName,
  isStdNamespace,
  isTemplateDeclaration,
  type Enum,
  type Interface,
  type Model,
  type Operation,
  type Program,
  type Namespace as TspNamespace,
  type Type,
  type Union,
} from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { getAllHttpServices, resolveAuthentication } from "@typespec/http";
import type {
  HttpCanonicalizer,
  OperationHttpCanonicalization,
} from "@typespec/http-canonicalization";
import { isUnionEnum } from "./components/enums/enums.jsx";
import {
  preAssignAnonymousResponseNames,
  resetAnonymousModels,
} from "./components/models/anonymous-models.js";
import {
  getDeclarationNamespaces,
  getServiceInterfaces,
  getServiceNamespaceName,
} from "./service-discovery.js";
import { findServiceNamespace } from "./utils/namespace-utils.js";

/** All resolved service types, computed once before rendering. */
export interface ServiceTypeResolution {
  /** The service namespace (first non-std namespace with content). */
  serviceNamespace: TspNamespace | undefined;
  /** The C#-normalized service namespace name. */
  serviceNamespaceName: string | undefined;
  /** All service interfaces (including synthetic ones for namespace-level operations). */
  interfaces: Interface[];
  /** All models to emit (namespace-level + operation-referenced). */
  models: Model[];
  /** All named enums from service namespaces. */
  enums: Enum[];
  /** All named unions that qualify as C# string enums. */
  unionEnums: Union[];
  /** Canonicalized HTTP operations per interface. */
  canonicalOpsMap: Map<string, OperationHttpCanonicalization[]>;
  /** Original business operation for each canonicalized HTTP operation. */
  canonicalOperationSourceMap: Map<OperationHttpCanonicalization, Operation>;
  /** Namespaces whose declarations are emitted without being referenced. */
  declarationNamespaces: Set<TspNamespace>;
}

export interface ServiceTypeResolutionOptions {
  /** Whether to canonicalize HTTP operations for controller and interface generation. */
  canonicalizeOperations?: boolean;
}

/**
 * Resolves all service types in a single pass, eliminating redundant
 * namespace traversals that previously occurred in individual components.
 *
 * Only types declared in the service namespace(s) are emitted unconditionally.
 * Types declared elsewhere are emitted only when the service references them,
 * directly or transitively.
 *
 * Ordering:
 * 1. Service namespace discovery
 * 2. Interface collection (including synthetic interfaces for namespace-level ops)
 * 3. Anonymous response model naming (depends on interfaces)
 * 4. Type discovery (service declarations + everything they reference)
 * 5. Canonicalization of HTTP operations
 */
export function resolveServiceTypes(
  program: Program,
  $: Typekit,
  canonicalizer: HttpCanonicalizer,
  options: ServiceTypeResolutionOptions = {},
): ServiceTypeResolution {
  resetAnonymousModels();

  const globalNs = program.getGlobalNamespaceType();

  // Phase 1: Service namespace
  const serviceNamespace = findServiceNamespace(globalNs);
  const serviceNamespaceName = getServiceNamespaceName(program);
  const declarationNamespaces = getDeclarationNamespaces(program);

  // Phase 2: Interfaces (includes synthetic ones for namespace-level operations)
  const interfaces = getServiceInterfaces(program, declarationNamespaces);

  // Phase 3: Pre-assign contextual names to anonymous response models
  preAssignAnonymousResponseNames(interfaces);

  // Phase 4: Models, enums and union-enums.
  // Auth scheme models (e.g. those referenced by `@useAuth`) are protocol metadata,
  // not payload data, so they must not be emitted as C# model classes (aligns with
  // the OpenAPI3 emitter, which emits them under `components.securitySchemes`).
  const authModels = getAuthSchemeModels(program);
  const { models, enums, unionEnums } = collectServiceTypes(
    $,
    declarationNamespaces,
    interfaces,
    authModels,
  );

  // Phase 5: Canonicalize HTTP operations only when operation artifacts are emitted.
  const { canonicalOpsMap, canonicalOperationSourceMap } =
    options.canonicalizeOperations === false
      ? {
          canonicalOpsMap: new Map<string, OperationHttpCanonicalization[]>(),
          canonicalOperationSourceMap: new Map<OperationHttpCanonicalization, Operation>(),
        }
      : canonicalizeAllInterfaces(canonicalizer, interfaces);

  return {
    serviceNamespace,
    serviceNamespaceName,
    interfaces,
    models,
    enums,
    unionEnums,
    canonicalOpsMap,
    canonicalOperationSourceMap,
    declarationNamespaces,
  };
}

/**
 * Canonicalize all operations for each interface, skipping any that fail.
 */
function canonicalizeAllInterfaces(
  canonicalizer: HttpCanonicalizer,
  interfaces: Interface[],
): {
  canonicalOpsMap: Map<string, OperationHttpCanonicalization[]>;
  canonicalOperationSourceMap: Map<OperationHttpCanonicalization, Operation>;
} {
  const canonicalOpsMap = new Map<string, OperationHttpCanonicalization[]>();
  const canonicalOperationSourceMap = new Map<OperationHttpCanonicalization, Operation>();
  for (const iface of interfaces) {
    const ops: OperationHttpCanonicalization[] = [];
    for (const [, op] of iface.operations) {
      try {
        const canonicalOp = canonicalizer.canonicalize(op) as OperationHttpCanonicalization;
        ops.push(canonicalOp);
        canonicalOperationSourceMap.set(canonicalOp, op);
      } catch {
        // Skip operations that can't be canonicalized
      }
    }
    canonicalOpsMap.set(iface.name, ops);
  }
  return { canonicalOpsMap, canonicalOperationSourceMap };
}

// ── Type discovery ──────────────────────────────────────────────────────

/** The set of types that qualify for emission. */
interface CollectedTypes {
  models: Model[];
  enums: Enum[];
  unionEnums: Union[];
}

/** Sink used while walking the type graph. */
interface TypeCollector {
  addModel(model: Model): void;
  addEnum(en: Enum): void;
  addUnion(union: Union): void;
}

/**
 * Collects every type that should be emitted: the declarations of the service
 * namespace(s) plus everything the service references, directly or transitively.
 *
 * Types declared outside those namespaces are only emitted when referenced, so
 * that the emitter does not generate dead code for types the service never exposes.
 *
 * @param authModels Models that back authentication schemes; these are excluded
 * from emission because they represent protocol metadata rather than payloads.
 */
function collectServiceTypes(
  $: Typekit,
  declarationNamespaces: Set<TspNamespace>,
  interfaces: Interface[],
  authModels: Set<Model>,
): CollectedTypes {
  const models: Model[] = [];
  const enums: Enum[] = [];
  const unionEnums: Union[] = [];
  const seenModels = new Set<Model>();
  const seenEnums = new Set<Enum>();
  const seenUnions = new Set<Union>();
  const visited = new Set<Type>();

  const collector: TypeCollector = {
    addModel(model) {
      if (seenModels.has(model)) return;
      seenModels.add(model);
      if (authModels.has(model)) return;
      if (shouldEmitModel($, model)) {
        models.push(model);
      }
    },
    addEnum(en) {
      if (seenEnums.has(en) || !en.name) return;
      seenEnums.add(en);
      if (isBuiltInNamespace(en.namespace)) return;
      enums.push(en);
    },
    addUnion(union) {
      if (seenUnions.has(union)) return;
      seenUnions.add(union);
      if (isBuiltInNamespace(union.namespace)) return;
      if (isUnionEnum(union)) {
        unionEnums.push(union);
      }
    },
  };

  // Declarations of the service itself are always emitted.
  const declaredUnions: Union[] = [];
  for (const ns of declarationNamespaces) {
    for (const model of ns.models?.values() ?? []) {
      collector.addModel(model);
    }
    for (const en of ns.enums?.values() ?? []) {
      collector.addEnum(en);
    }
    for (const union of ns.unions?.values() ?? []) {
      collector.addUnion(union);
      declaredUnions.push(union);
    }
  }

  // Walk operations to discover referenced types (template instantiations, etc.)
  for (const iface of interfaces) {
    for (const [, op] of iface.operations) {
      discoverTypes($, op.returnType, collector, visited);
      for (const param of op.parameters?.properties?.values() ?? []) {
        discoverTypes($, param.type, collector, visited);
      }
    }
  }

  // Walk the declared types to discover everything they reference.
  for (const model of [...models]) {
    for (const prop of model.properties.values()) {
      discoverTypes($, prop.type, collector, visited);
    }
    if (model.baseModel) {
      discoverTypes($, model.baseModel, collector, visited);
    }
  }
  for (const union of declaredUnions) {
    discoverTypes($, union, collector, visited);
  }

  return { models, enums, unionEnums };
}

/** Recursively discovers the emittable types referenced by a type. */
function discoverTypes($: Typekit, type: Type, collector: TypeCollector, visited: Set<Type>): void {
  if (visited.has(type)) return;
  visited.add(type);

  switch (type.kind) {
    case "Model":
      if ($.array.is(type) || $.record.is(type)) {
        if (type.indexer?.value) {
          discoverTypes($, type.indexer.value, collector, visited);
        }
        return;
      }
      // `HttpPart<T>` is an empty envelope that the emitter unwraps to its payload
      // type, so `T` is only reachable through the template arguments.
      if (isHttpPartModel(type)) {
        const payload = type.templateMapper!.args[0];
        if (payload?.entityKind === "Type") {
          discoverTypes($, payload, collector, visited);
        }
        return;
      }
      collector.addModel(type);
      for (const prop of type.properties.values()) {
        discoverTypes($, prop.type, collector, visited);
      }
      if (type.baseModel) {
        discoverTypes($, type.baseModel, collector, visited);
      }
      return;
    case "Union":
      collector.addUnion(type);
      for (const variant of type.variants.values()) {
        discoverTypes($, variant.type, collector, visited);
      }
      return;
    case "UnionVariant":
      discoverTypes($, type.type, collector, visited);
      return;
    case "Enum":
      collector.addEnum(type);
      return;
    case "EnumMember":
      collector.addEnum(type.enum);
      return;
    case "ModelProperty":
      discoverTypes($, type.type, collector, visited);
      return;
    case "Tuple":
      for (const value of type.values) {
        discoverTypes($, value, collector, visited);
      }
      return;
    default:
      return;
  }
}

/** Whether a namespace belongs to the TypeSpec standard library. */
function isBuiltInNamespace(ns: TspNamespace | undefined): boolean {
  if (!ns) return false;
  if (isStdNamespace(ns)) return true;
  const nsName = getNamespaceFullName(ns);
  return nsName === "TypeSpec" || nsName.startsWith("TypeSpec.");
}

/**
 * Collects the models that back authentication schemes for every HTTP service.
 * These correspond to `@useAuth` scheme models (e.g. `ApiKeyAuth`, `BearerAuth`)
 * and are emitted as security metadata, not as payload model classes.
 */
function getAuthSchemeModels(program: Program): Set<Model> {
  const authModels = new Set<Model>();
  const [services] = getAllHttpServices(program);
  for (const service of services) {
    for (const scheme of resolveAuthentication(service).schemes) {
      if (scheme.model) {
        authModels.add(scheme.model);
      }
    }
  }
  return authModels;
}

function shouldEmitModel($: Typekit, model: Model): boolean {
  if (model.name === "") return true;
  if (!model.name) return false;
  if ($.array.is(model)) return false;
  if ($.record.is(model)) return false;
  if (isTemplateDeclaration(model)) return false;
  if (isHttpPartModel(model)) return false;
  if (isMultipartBodyContainer(model)) return false;
  if (model.templateMapper) return true;
  if (model.namespace && isStdNamespace(model.namespace)) return false;
  const nsName = model.namespace ? getNamespaceFullName(model.namespace) : "";
  if (nsName.startsWith("TypeSpec.Http") || nsName.startsWith("TypeSpec.Rest")) return false;
  return true;
}

/** Detects models whose properties are all HttpPart<T>. */
function isMultipartBodyContainer(model: Model): boolean {
  if (model.properties.size === 0) return false;
  for (const prop of model.properties.values()) {
    if (isHttpPartType(prop.type)) continue;
    return false;
  }
  return true;
}

function isHttpPartType(type: Type): boolean {
  if (type.kind !== "Model") return false;
  if (isHttpPartModel(type)) return true;
  if (type.indexer?.value) {
    return isHttpPartType(type.indexer.value);
  }
  return false;
}

/** Whether a model is an instantiation of `HttpPart<T>`. */
function isHttpPartModel(model: Model): boolean {
  return model.name === "HttpPart" && model.templateMapper !== undefined;
}
