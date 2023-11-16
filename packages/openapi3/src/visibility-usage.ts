import {
  Interface,
  Namespace,
  Operation,
  Program,
  Type,
  ignoreDiagnostics,
} from "@typespec/compiler";
import {
  MetadataInfo,
  Visibility,
  getHttpOperation,
  resolveRequestVisibility,
} from "@typespec/http";

export interface VisibilityUsageTracker {
  getUsage(type: Type): Set<Visibility> | undefined;
}

export type OperationContainer = Namespace | Interface | Operation;

export function resolveVisibilityUsage(
  program: Program,
  metadataInfo: MetadataInfo,
  types: OperationContainer | OperationContainer[]
): VisibilityUsageTracker {
  const usages = new Map<Type, Set<Visibility>>();
  if (Array.isArray(types)) {
    for (const item of types) {
      addUsagesInContainer(program, metadataInfo, item, usages);
    }
  } else {
    addUsagesInContainer(program, metadataInfo, types, usages);
  }

  return {
    getUsage: (type: Type) => {
      const used = usages.get(type);
      if (used === undefined) {
        return undefined;
      }
      return usages.get(type);
    },
  };
}

function addUsagesInContainer(
  program: Program,
  metadataInfo: MetadataInfo,

  type: OperationContainer,
  usages: Map<Type, Set<Visibility>>
) {
  switch (type.kind) {
    case "Namespace":
      addUsagesInNamespace(program, metadataInfo, type, usages);
      break;
    case "Interface":
      addUsagesInInterface(program, metadataInfo, type, usages);
      break;
    case "Operation":
      addUsagesInOperation(program, metadataInfo, type, usages);
      break;
  }
}

function trackUsage(
  metadataInfo: MetadataInfo,
  usages: Map<Type, Set<Visibility>>,
  type: Type,
  usage: Visibility
) {
  const effective = metadataInfo.getEffectivePayloadType(type, usage);

  trackUsageExact(usages, type, usage);
  if (effective !== type) {
    trackUsageExact(usages, effective, usage);
  }
}
function trackUsageExact(usages: Map<Type, Set<Visibility>>, type: Type, usage: Visibility) {
  const existingFlag = usages.get(type) ?? new Set();
  existingFlag.add(usage);
  usages.set(type, existingFlag);
}

function addUsagesInNamespace(
  program: Program,
  metadataInfo: MetadataInfo,
  namespace: Namespace,
  usages: Map<Type, Set<Visibility>>
): void {
  for (const subNamespace of namespace.namespaces.values()) {
    addUsagesInNamespace(program, metadataInfo, subNamespace, usages);
  }
  for (const Interface of namespace.interfaces.values()) {
    addUsagesInInterface(program, metadataInfo, Interface, usages);
  }
  for (const operation of namespace.operations.values()) {
    addUsagesInOperation(program, metadataInfo, operation, usages);
  }
}

function addUsagesInInterface(
  program: Program,
  metadataInfo: MetadataInfo,

  Interface: Interface,
  usages: Map<Type, Set<Visibility>>
): void {
  for (const operation of Interface.operations.values()) {
    addUsagesInOperation(program, metadataInfo, operation, usages);
  }
}

function addUsagesInOperation(
  program: Program,
  metadataInfo: MetadataInfo,
  operation: Operation,
  usages: Map<Type, Set<Visibility>>
): void {
  const httpOperation = ignoreDiagnostics(getHttpOperation(program, operation));

  const visibility = resolveRequestVisibility(program, operation, httpOperation.verb);
  navigateReferencedTypes(operation.parameters, (type) =>
    trackUsage(metadataInfo, usages, type, visibility)
  );
  navigateReferencedTypes(operation.returnType, (type) =>
    trackUsage(metadataInfo, usages, type, Visibility.Read)
  );
}

function navigateReferencedTypes(
  type: Type,
  callback: (type: Type) => void,
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
    default:
      callback(type);
      break;
  }
}

function navigateIterable<T extends Type>(
  map: Map<string | symbol, T> | T[],
  callback: (type: Type) => void,
  visited: Set<Type> = new Set()
) {
  for (const type of map.values()) {
    navigateReferencedTypes(type, callback, visited);
  }
}
