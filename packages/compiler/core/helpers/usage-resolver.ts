import {
  EnumType,
  InterfaceType,
  ModelType,
  NamespaceType,
  OperationType,
  TupleType,
  Type,
  UnionType,
} from "../types.js";

// prettier-ignore
export enum UsageFlags {
  None   = 0,
  Input  = 1 << 1,
  Output = 1 << 2,
}

export type TrackableType = ModelType | EnumType | UnionType | TupleType;

export interface UsageTracker {
  readonly types: readonly TrackableType[];
  isUsedAs(type: TrackableType, usage: UsageFlags): boolean;
}

/**
 * Resolve usage(input, output or both) of various types in the given namespace.
 * Will recursively scan all namespace, interfaces and operations contained inside the namespace.
 * @param namespace Entrypoint namespace to get usage from.
 * @returns Map of types to usage.
 */
export function resolveUsages(type: NamespaceType | InterfaceType | OperationType): UsageTracker {
  const usages = new Map<TrackableType, UsageFlags>();
  switch (type.kind) {
    case "Namespace":
      addUsagesInNamespace(type, usages);
      break;
    case "Interface":
      addUsagesInInterface(type, usages);
      break;
    case "Operation":
      addUsagesInOperation(type, usages);
      break;
  }
  return {
    types: [...usages.keys()],
    isUsedAs: (type: TrackableType, usage) => {
      const used = usages.get(type);
      if (used === undefined) {
        return false;
      }
      return Boolean(used & usage);
    },
  };
}

function trackUsage(
  usages: Map<TrackableType, UsageFlags>,
  type: TrackableType,
  usage: UsageFlags
) {
  const existingFlag = usages.get(type) ?? UsageFlags.None;
  usages.set(type, existingFlag | usage);
}

function addUsagesInNamespace(
  namespace: NamespaceType,
  usages: Map<TrackableType, UsageFlags>
): void {
  for (const subNamespace of namespace.namespaces.values()) {
    addUsagesInNamespace(subNamespace, usages);
  }
  for (const interfaceType of namespace.interfaces.values()) {
    addUsagesInInterface(interfaceType, usages);
  }
  for (const operation of namespace.operations.values()) {
    addUsagesInOperation(operation, usages);
  }
}

function addUsagesInInterface(
  interfaceType: InterfaceType,
  usages: Map<TrackableType, UsageFlags>
): void {
  for (const operation of interfaceType.operations.values()) {
    addUsagesInOperation(operation, usages);
  }
}

function addUsagesInOperation(
  operation: OperationType,
  usages: Map<TrackableType, UsageFlags>
): void {
  navigateReferencedTypes(operation.parameters, (type) =>
    trackUsage(usages, type, UsageFlags.Input)
  );
  navigateReferencedTypes(operation.returnType, (type) =>
    trackUsage(usages, type, UsageFlags.Output)
  );
}

function navigateReferencedTypes(
  type: Type,
  callback: (type: TrackableType) => void,
  visited: Set<Type> = new Set()
) {
  if (visited.has(type)) {
    return;
  }
  visited.add(type);
  switch (type.kind) {
    case "Model":
      callback(type);
      navigateIterable(type.properties, callback, visited);
      navigateIterable(type.derivedModels, callback, visited);
      type.baseModel && navigateReferencedTypes(type.baseModel, callback, visited);
      break;
    case "ModelProperty":
      navigateReferencedTypes(type.type, callback, visited);
      break;
    case "Union":
      callback(type);
      navigateIterable(type.options, callback, visited);
      break;
    case "Enum":
    case "Tuple":
      callback(type);
      break;
  }
}

function navigateIterable<T extends Type>(
  map: Map<string, T> | T[],
  callback: (type: TrackableType) => void,
  visited: Set<Type> = new Set()
) {
  for (const type of map.values()) {
    navigateReferencedTypes(type, callback, visited);
  }
}
