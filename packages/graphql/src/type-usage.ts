import {
  isArrayModelType,
  navigateTypesInNamespace,
  type Namespace,
  type Operation,
  type Program,
  type Type,
} from "@typespec/compiler";
import { getOperationKind, type GraphQLOperationKind } from "./lib/operation-kind.js";
import { createVisibilityFilters, isPropertyVisible } from "./lib/visibility.js";

/**
 * GraphQL-specific flags for type usage tracking (input vs output).
 */
export enum GraphQLTypeUsage {
  /** Type is used as an input (operation parameter or nested within one) */
  Input = "Input",
  /** Type is used as an input to a @query or @subscription operation */
  InputQuery = "InputQuery",
  /** Type is used as an input to a @mutation operation */
  InputMutation = "InputMutation",
  /** Type is used as an output (operation return type or nested within one) */
  Output = "Output",
}

/**
 * Usage and emission-reachability information for the original TypeSpec types
 * in a schema. Keeping an unreferenced declaration does not give it usage flags.
 */
export interface TypeUsageResolver {
  /**
   * Returns the recorded input/output usages, or undefined if no operation
   * references the type. The returned set is resolver-owned; treat it as read-only.
   */
  getUsage(type: Type): Set<GraphQLTypeUsage> | undefined;
  /**
   * Whether the type is outside the resolver's reachable set. When unreachable
   * types are retained, unreferenced schema declarations return false here.
   */
  isUnreachable(type: Type): boolean;
  /**
   * Whether a model used by query/subscription inputs and mutation inputs has
   * different visible own-property sets in those contexts. When true, separate
   * input types are needed, such as UserQueryInput and UserMutationInput.
   */
  hasInputOperationVariance(type: Type): boolean;
}

/**
 * Tracks model, scalar, enum, and union usage from operations in `root` and its
 * nested namespaces and interfaces, following referenced types transitively.
 *
 * Query and subscription inputs share a usage category; mutation inputs use a
 * separate category for visibility-based input splitting. Usage tracks source
 * references before visibility filtering.
 *
 * @param omitUnreachableTypes - When false, also retains unreferenced model,
 * scalar, enum, and union declarations in the schema without assigning usages.
 */
export function resolveTypeUsage(
  program: Program,
  root: Namespace,
  omitUnreachableTypes: boolean,
): TypeUsageResolver {
  const reachableTypes = new Set<Type>();
  const usages = new Map<Type, Set<GraphQLTypeUsage>>();
  const inputOperationVariance = new Set<Type>();

  addUsagesInNamespace(program, root, reachableTypes, usages);

  // Pre-compute which models need split input types
  const filters = createVisibilityFilters(program);
  for (const [type, usage] of usages) {
    if (
      type.kind === "Model" &&
      usage.has(GraphQLTypeUsage.InputQuery) &&
      usage.has(GraphQLTypeUsage.InputMutation)
    ) {
      const queryVisible = new Set<string>();
      const mutationVisible = new Set<string>();
      for (const prop of type.properties.values()) {
        if (isPropertyVisible(program, prop, filters.query)) queryVisible.add(prop.name);
        if (isPropertyVisible(program, prop, filters.mutation)) mutationVisible.add(prop.name);
      }
      if (
        queryVisible.size !== mutationVisible.size ||
        ![...queryVisible].every((k) => mutationVisible.has(k))
      ) {
        inputOperationVariance.add(type);
      }
    }
  }

  if (!omitUnreachableTypes) {
    const markReachable = (type: Type) => {
      reachableTypes.add(type);
    };
    navigateTypesInNamespace(root, {
      model: markReachable,
      scalar: markReachable,
      enum: markReachable,
      union: markReachable,
    });
  }

  return {
    getUsage: (type: Type) => usages.get(type),
    isUnreachable: (type: Type) => !reachableTypes.has(type),
    hasInputOperationVariance: (type: Type) => inputOperationVariance.has(type),
  };
}

function trackUsage(
  reachableTypes: Set<Type>,
  usages: Map<Type, Set<GraphQLTypeUsage>>,
  type: Type,
  usage: GraphQLTypeUsage,
) {
  reachableTypes.add(type);
  const existing = usages.get(type) ?? new Set();
  existing.add(usage);
  usages.set(type, existing);
}

function addUsagesInNamespace(
  program: Program,
  namespace: Namespace,
  reachableTypes: Set<Type>,
  usages: Map<Type, Set<GraphQLTypeUsage>>,
): void {
  for (const subNamespace of namespace.namespaces.values()) {
    addUsagesInNamespace(program, subNamespace, reachableTypes, usages);
  }
  for (const iface of namespace.interfaces.values()) {
    for (const operation of iface.operations.values()) {
      addUsagesFromOperation(program, operation, reachableTypes, usages);
    }
  }
  for (const operation of namespace.operations.values()) {
    addUsagesFromOperation(program, operation, reachableTypes, usages);
  }
}

function inputUsageForKind(kind: GraphQLOperationKind | undefined): GraphQLTypeUsage {
  if (kind === "Query" || kind === "Subscription") return GraphQLTypeUsage.InputQuery;
  return GraphQLTypeUsage.InputMutation;
}

function addUsagesFromOperation(
  program: Program,
  operation: Operation,
  reachableTypes: Set<Type>,
  usages: Map<Type, Set<GraphQLTypeUsage>>,
): void {
  const kind = getOperationKind(program, operation);
  const inputUsage = inputUsageForKind(kind);
  for (const param of operation.parameters.properties.values()) {
    navigateReferencedTypes(param.type, GraphQLTypeUsage.Input, reachableTypes, usages);
    navigateReferencedTypes(param.type, inputUsage, reachableTypes, usages);
  }
  navigateReferencedTypes(operation.returnType, GraphQLTypeUsage.Output, reachableTypes, usages);
}

function navigateReferencedTypes(
  type: Type,
  usage: GraphQLTypeUsage,
  reachableTypes: Set<Type>,
  usages: Map<Type, Set<GraphQLTypeUsage>>,
  visited: Set<Type> = new Set(),
): void {
  if (visited.has(type)) return;
  visited.add(type);

  switch (type.kind) {
    case "Model":
      if (isArrayModelType(type)) {
        if (type.indexer?.value) {
          navigateReferencedTypes(type.indexer.value, usage, reachableTypes, usages, visited);
        }
      } else {
        trackUsage(reachableTypes, usages, type, usage);
        for (const prop of type.properties.values()) {
          navigateReferencedTypes(prop.type, usage, reachableTypes, usages, visited);
        }
        if (type.baseModel) {
          navigateReferencedTypes(type.baseModel, usage, reachableTypes, usages, visited);
        }
      }
      break;

    case "Union":
      trackUsage(reachableTypes, usages, type, usage);
      for (const variant of type.variants.values()) {
        navigateReferencedTypes(variant.type, usage, reachableTypes, usages, visited);
      }
      break;

    case "Scalar":
    case "Enum":
      trackUsage(reachableTypes, usages, type, usage);
      break;

    default:
      break;
  }
}
