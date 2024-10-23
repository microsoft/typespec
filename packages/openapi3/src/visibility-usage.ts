import {
  Interface,
  Namespace,
  Operation,
  Program,
  Type,
  ignoreDiagnostics,
  navigateTypesInNamespace,
} from "@typespec/compiler";
import { TwoLevelMap } from "@typespec/compiler/utils";
import {
  MetadataInfo,
  Visibility,
  getHttpOperation,
  resolveRequestVisibility,
} from "@typespec/http";

export interface VisibilityUsageTracker {
  getUsage(type: Type): Set<Visibility> | undefined;
  isUnreachable(type: Type): boolean;
}

export type OperationContainer = Namespace | Interface | Operation;

export function resolveVisibilityUsage(
  program: Program,
  metadataInfo: MetadataInfo,
  root: Namespace,
  omitUnreachableTypes: boolean,
): VisibilityUsageTracker {
  const usages = new Map<Type, Set<Visibility>>();
  addUsagesInContainer(program, metadataInfo, root, usages);

  const reachableTypes = new Set<Type>(usages.keys());

  if (!omitUnreachableTypes) {
    // Evaluate all unreferenced types and the types they reference with Visibility.All
    const trackType = (type: Type) => {
      if (!usages.has(type)) {
        navigateReferencedTypes(type, Visibility.All, (type, vis) =>
          trackUsageExact(usages, type, vis),
        );
      }
    };
    navigateTypesInNamespace(root, {
      model: trackType,
      scalar: trackType,
      enum: trackType,
      union: trackType,
    });
  }
  return {
    getUsage: (type: Type) => {
      const used = usages.get(type);
      if (used === undefined) {
        return undefined;
      }
      return usages.get(type);
    },
    isUnreachable: (type: Type) => {
      return !reachableTypes.has(type);
    },
  };
}

function addUsagesInContainer(
  program: Program,
  metadataInfo: MetadataInfo,

  type: OperationContainer,
  usages: Map<Type, Set<Visibility>>,
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
  usage: Visibility,
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
  usages: Map<Type, Set<Visibility>>,
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
  usages: Map<Type, Set<Visibility>>,
): void {
  for (const operation of Interface.operations.values()) {
    addUsagesInOperation(program, metadataInfo, operation, usages);
  }
}

function addUsagesInOperation(
  program: Program,
  metadataInfo: MetadataInfo,
  operation: Operation,
  usages: Map<Type, Set<Visibility>>,
): void {
  const httpOperation = ignoreDiagnostics(getHttpOperation(program, operation));

  const visibility = resolveRequestVisibility(program, operation, httpOperation.verb);
  if (httpOperation.parameters.body) {
    navigateReferencedTypes(httpOperation.parameters.body.type, visibility, (type, vis) =>
      trackUsage(metadataInfo, usages, type, vis),
    );
  }
  for (const param of httpOperation.parameters.parameters) {
    navigateReferencedTypes(param.param, visibility, (type, vis) =>
      trackUsage(metadataInfo, usages, type, vis),
    );
  }

  navigateReferencedTypes(operation.returnType, Visibility.Read, (type, vis) =>
    trackUsage(metadataInfo, usages, type, vis),
  );
}

function navigateReferencedTypes(
  type: Type,
  usage: Visibility,
  callback: (type: Type, visibility: Visibility) => void,
  visited: TwoLevelMap<Type, Visibility, true> = new TwoLevelMap<Type, Visibility, true>(),
) {
  if (visited.get(type)?.get(usage)) {
    return;
  }
  visited.getOrAdd(type, usage, () => true);
  switch (type.kind) {
    case "Model":
      callback(type, usage);
      navigateIterable(type.properties, usage, callback, visited);
      if (type.baseModel) {
        navigateReferencedTypes(type.baseModel, usage, callback, visited);
      }
      navigateIterable(type.derivedModels, usage, callback, visited);
      if (type.baseModel) {
        navigateReferencedTypes(type.baseModel, usage, callback, visited);
      }
      if (type.indexer) {
        if (type.indexer.key.name === "integer") {
          navigateReferencedTypes(type.indexer.value, usage | Visibility.Item, callback, visited);
        } else {
          navigateReferencedTypes(type.indexer.value, usage, callback, visited);
        }
      }
      break;
    case "ModelProperty":
      navigateReferencedTypes(type.type, usage, callback, visited);
      break;
    case "Union":
      callback(type, usage);
      navigateIterable(type.variants, usage, callback, visited);
      break;
    case "UnionVariant":
      navigateReferencedTypes(type.type, usage, callback, visited);
      break;
    default:
      callback(type, usage);
      break;
  }
}

function navigateIterable<T extends Type>(
  map: Map<string | symbol, T> | T[],
  usage: Visibility,
  callback: (type: Type, visibility: Visibility) => void,
  visited: TwoLevelMap<Type, Visibility, true>,
) {
  for (const type of map.values()) {
    navigateReferencedTypes(type, usage, callback, visited);
  }
}
