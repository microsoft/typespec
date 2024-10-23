import { isArray } from "../../utils/misc.js";
import { Enum, Interface, Model, Namespace, Operation, Tuple, Type, Union } from "../types.js";

// prettier-ignore
export enum UsageFlags {
  None   = 0,
  Input  = 1 << 1,
  Output = 1 << 2,
}

export type TrackableType = Model | Enum | Union | Tuple;

export interface UsageTracker {
  readonly types: readonly TrackableType[];
  isUsedAs(type: TrackableType, usage: UsageFlags): boolean;
}

export type OperationContainer = Namespace | Interface | Operation;
/**
 * Resolve usage(input, output or both) of various types in the given namespace.
 * Will recursively scan all namespace, interfaces and operations contained inside the namespace.
 * @param types Entrypoint(s) namespace, interface or operations to get usage from.
 * @returns Map of types to usage.
 */
export function resolveUsages(types: OperationContainer | OperationContainer[]): UsageTracker {
  const usages = new Map<TrackableType, UsageFlags>();
  if (isArray(types)) {
    for (const item of types) {
      addUsagesInContainer(item, usages);
    }
  } else {
    addUsagesInContainer(types, usages);
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

function addUsagesInContainer(type: OperationContainer, usages: Map<TrackableType, UsageFlags>) {
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
}

function trackUsage(
  usages: Map<TrackableType, UsageFlags>,
  type: TrackableType,
  usage: UsageFlags,
) {
  const existingFlag = usages.get(type) ?? UsageFlags.None;
  usages.set(type, existingFlag | usage);
}

function addUsagesInNamespace(namespace: Namespace, usages: Map<TrackableType, UsageFlags>): void {
  for (const subNamespace of namespace.namespaces.values()) {
    addUsagesInNamespace(subNamespace, usages);
  }
  for (const Interface of namespace.interfaces.values()) {
    addUsagesInInterface(Interface, usages);
  }
  for (const operation of namespace.operations.values()) {
    addUsagesInOperation(operation, usages);
  }
}

function addUsagesInInterface(Interface: Interface, usages: Map<TrackableType, UsageFlags>): void {
  for (const operation of Interface.operations.values()) {
    addUsagesInOperation(operation, usages);
  }
}

function addUsagesInOperation(operation: Operation, usages: Map<TrackableType, UsageFlags>): void {
  navigateReferencedTypes(operation.parameters, (type) =>
    trackUsage(usages, type, UsageFlags.Input),
  );
  navigateReferencedTypes(operation.returnType, (type) =>
    trackUsage(usages, type, UsageFlags.Output),
  );
}

function navigateReferencedTypes(
  type: Type,
  callback: (type: TrackableType) => void,
  visited: Set<Type> = new Set(),
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
      type.indexer?.value && navigateReferencedTypes(type.indexer.value, callback, visited);
      break;
    case "ModelProperty":
      navigateReferencedTypes(type.type, callback, visited);
      break;
    case "Union":
      callback(type);
      navigateIterable(type.variants, callback, visited);
      break;
    case "UnionVariant":
      navigateReferencedTypes(type.type, callback, visited);
      break;
    case "Enum":
    case "Tuple":
      callback(type);
      break;
  }
}

function navigateIterable<T extends Type>(
  map: Map<string | symbol, T> | T[],
  callback: (type: TrackableType) => void,
  visited: Set<Type> = new Set(),
) {
  for (const type of map.values()) {
    navigateReferencedTypes(type, callback, visited);
  }
}
