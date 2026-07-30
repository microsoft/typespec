import {
  getNamespaceFullName,
  isStdNamespace,
  isTemplateDeclaration,
  listServices,
  type Enum,
  type Interface,
  type Model,
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
import { getServiceInterfaces, getServiceNamespaceName } from "./service-discovery.js";
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
}

/**
 * Resolves all service types in a single pass, eliminating redundant
 * namespace traversals that previously occurred in individual components.
 *
 * Ordering:
 * 1. Service namespace discovery
 * 2. Interface collection (including synthetic interfaces for namespace-level ops)
 * 3. Anonymous response model naming (depends on interfaces)
 * 4. Enum and union-enum collection
 * 5. Model discovery (walks operations from interfaces + namespace models)
 * 6. Canonicalization of HTTP operations
 */
export function resolveServiceTypes(
  program: Program,
  $: Typekit,
  canonicalizer: HttpCanonicalizer,
): ServiceTypeResolution {
  resetAnonymousModels();

  const globalNs = program.getGlobalNamespaceType();

  // Phase 1: Service namespace
  const serviceNamespace = findServiceNamespace(globalNs);
  const serviceNamespaceName = getServiceNamespaceName(program);

  // Phase 2: Interfaces (includes synthetic ones for namespace-level operations)
  const interfaces = getServiceInterfaces(program);

  // Phase 3: Pre-assign contextual names to anonymous response models
  preAssignAnonymousResponseNames(interfaces);

  // Phase 4: Enums and union-enums from all non-std namespaces
  const enums: Enum[] = [];
  const unionEnums: Union[] = [];
  collectEnumsFromNamespaces(globalNs, enums, unionEnums);

  // Phase 5: Model discovery (namespace models + operation-referenced models)
  // Auth scheme models (e.g. those referenced by `@useAuth`) are protocol metadata,
  // not payload data, so they must not be emitted as C# model classes (aligns with
  // the OpenAPI3 emitter, which emits them under `components.securitySchemes`).
  const authModels = getAuthSchemeModels(program);
  const models = getServiceModels($, program, authModels);

  // Phase 6: Canonicalize all HTTP operations
  const canonicalOpsMap = canonicalizeAllInterfaces(canonicalizer, interfaces);

  return {
    serviceNamespace,
    serviceNamespaceName,
    interfaces,
    models,
    enums,
    unionEnums,
    canonicalOpsMap,
  };
}

/**
 * Collects all enums and union-enums from non-std namespaces in a single walk.
 */
function collectEnumsFromNamespaces(
  globalNs: TspNamespace,
  enums: Enum[],
  unionEnums: Union[],
): void {
  const seenEnums = new Set<Enum>();
  const seenUnions = new Set<Union>();

  function walk(ns: TspNamespace): void {
    for (const en of ns.enums?.values() ?? []) {
      if (!seenEnums.has(en) && en.name) {
        seenEnums.add(en);
        enums.push(en);
      }
    }
    for (const union of ns.unions?.values() ?? []) {
      if (!seenUnions.has(union) && isUnionEnum(union)) {
        seenUnions.add(union);
        unionEnums.push(union);
      }
    }
    for (const childNs of ns.namespaces?.values() ?? []) {
      if (isStdNamespace(childNs)) continue;
      walk(childNs);
    }
  }

  walk(globalNs);
}

/**
 * Canonicalize all operations for each interface, skipping any that fail.
 */
function canonicalizeAllInterfaces(
  canonicalizer: HttpCanonicalizer,
  interfaces: Interface[],
): Map<string, OperationHttpCanonicalization[]> {
  const result = new Map<string, OperationHttpCanonicalization[]>();
  for (const iface of interfaces) {
    const ops: OperationHttpCanonicalization[] = [];
    for (const [, op] of iface.operations) {
      try {
        ops.push(canonicalizer.canonicalize(op) as OperationHttpCanonicalization);
      } catch {
        // Skip operations that can't be canonicalized
      }
    }
    result.set(iface.name, ops);
  }
  return result;
}

// ── Model discovery ─────────────────────────────────────────────────────

/**
 * Retrieves all models from the program that should be emitted.
 * Includes namespace-level models AND models referenced by operations.
 *
 * Only seeds the initial collection from `@service`-decorated namespaces to avoid
 * picking up models from library namespaces (e.g. Azure.ResourceManager.CommonTypes)
 * that share names with service models and would cause duplicate class names with a
 * `_2` suffix.  Models that are transitively referenced by service operations are still
 * discovered and emitted via discoverReferencedModels / discoverModelsInType regardless
 * of which namespace they live in.
 *
 * Falls back to scanning all non-std namespaces when no `@service` is present.
 *
 * @param authModels Models that back authentication schemes; these are excluded
 * from emission because they represent protocol metadata rather than payloads.
 */
function getServiceModels($: Typekit, program: Program, authModels: Set<Model>): Model[] {
  const globalNs = program.getGlobalNamespaceType();
  const models: Model[] = [];
  const seen = new Set<Model>();

  function addModel(model: Model) {
    if (seen.has(model)) return;
    seen.add(model);
    if (authModels.has(model)) return;
    if (shouldEmitModel($, model)) {
      models.push(model);
    }
  }

  const services = listServices(program);
  if (services.length > 0) {
    // Restrict initial collection to @service-decorated namespaces to avoid picking up
    // models from library namespaces (e.g. Azure.ResourceManager) that would otherwise
    // cause duplicate class name collisions (the infamous `_2` suffix bug).
    for (const service of services) {
      collectModelsFromNamespace($, service.type, models, seen, authModels);
    }

    // Walk operations in service namespaces to discover referenced models.
    const visited = new Set<Type>();
    for (const service of services) {
      discoverReferencedModels($, service.type, addModel, visited);
    }

    // Walk all collected model properties to discover anonymous sub-models.
    const modelsSnapshot = [...models];
    for (const model of modelsSnapshot) {
      for (const prop of model.properties.values()) {
        discoverModelsInType($, prop.type, addModel, visited);
      }
      if (model.baseModel) {
        discoverModelsInType($, model.baseModel, addModel, visited);
      }
    }
  } else {
    // Fallback: no @service decorator – behave as before and scan all non-std namespaces.
    for (const model of globalNs.models.values()) {
      addModel(model);
    }
    for (const ns of globalNs.namespaces.values()) {
      if (isStdNamespace(ns)) continue;
      collectModelsFromNamespace($, ns, models, seen, authModels);
    }

    const visited = new Set<Type>();
    for (const ns of globalNs.namespaces.values()) {
      if (isStdNamespace(ns)) continue;
      discoverReferencedModels($, ns, addModel, visited);
    }

    const modelsSnapshot = [...models];
    for (const model of modelsSnapshot) {
      for (const prop of model.properties.values()) {
        discoverModelsInType($, prop.type, addModel, visited);
      }
      if (model.baseModel) {
        discoverModelsInType($, model.baseModel, addModel, visited);
      }
    }
  }

  return models;
}

/** Walks operations in a namespace to discover referenced model types. */
function discoverReferencedModels(
  $: Typekit,
  ns: TspNamespace,
  addModel: (m: Model) => void,
  visited: Set<Type>,
): void {
  for (const op of ns.operations?.values() ?? []) {
    discoverModelsInType($, op.returnType, addModel, visited);
    for (const param of op.parameters?.properties?.values() ?? []) {
      discoverModelsInType($, param.type, addModel, visited);
    }
  }
  for (const iface of ns.interfaces?.values() ?? []) {
    for (const op of iface.operations?.values() ?? []) {
      discoverModelsInType($, op.returnType, addModel, visited);
      for (const param of op.parameters?.properties?.values() ?? []) {
        discoverModelsInType($, param.type, addModel, visited);
      }
    }
  }
  for (const childNs of ns.namespaces?.values() ?? []) {
    if (isStdNamespace(childNs)) continue;
    discoverReferencedModels($, childNs, addModel, visited);
  }
}

/** Recursively discovers models referenced by a type. */
function discoverModelsInType(
  $: Typekit,
  type: Type,
  addModel: (m: Model) => void,
  visited: Set<Type>,
): void {
  if (visited.has(type)) return;
  visited.add(type);

  if (type.kind === "Model") {
    if ($.array.is(type)) {
      if (type.indexer?.value) {
        discoverModelsInType($, type.indexer.value, addModel, visited);
      }
    } else if (!$.record.is(type)) {
      addModel(type);
      for (const prop of type.properties.values()) {
        discoverModelsInType($, prop.type, addModel, visited);
      }
      if (type.baseModel) {
        discoverModelsInType($, type.baseModel, addModel, visited);
      }
      if (type.templateMapper) {
        for (const arg of type.templateMapper.args) {
          if (arg.entityKind === "Type") {
            discoverModelsInType($, arg, addModel, visited);
          }
        }
      }
    }
  } else if (type.kind === "Union") {
    for (const variant of type.variants.values()) {
      discoverModelsInType($, variant.type, addModel, visited);
    }
  }
}

function collectModelsFromNamespace(
  $: Typekit,
  ns: TspNamespace,
  models: Model[],
  seen: Set<Model>,
  authModels: Set<Model>,
): void {
  for (const model of ns.models?.values() ?? []) {
    if (!seen.has(model) && !authModels.has(model) && shouldEmitModel($, model)) {
      seen.add(model);
      models.push(model);
    }
  }
  for (const childNs of ns.namespaces?.values() ?? []) {
    collectModelsFromNamespace($, childNs, models, seen, authModels);
  }
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
  if (model.name === "HttpPart" && model.templateMapper) return false;
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
  if (type.name === "HttpPart" && type.templateMapper) return true;
  if (type.indexer?.value) {
    return isHttpPartType(type.indexer.value);
  }
  return false;
}
