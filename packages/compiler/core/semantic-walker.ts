import { Program } from "./program.js";
import {
  ArrayType,
  EnumType,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  SemanticNodeListener,
  TemplateParameterType,
  TupleType,
  Type,
  UnionType,
} from "./types.js";

export function navigateProgram(
  program: Program,
  listeners: EventEmitter<SemanticNodeListener> | SemanticNodeListener
) {
  const eventEmitter =
    listeners instanceof EventEmitter ? listeners : createEventEmitter(listeners);
  const visited = new Set();

  eventEmitter.emit("root", program);
  if (!program.checker) {
    return;
  }
  navigateNamespaceType(program.checker.getGlobalNamespaceType(), eventEmitter, visited);
}

function navigateNamespaceType(
  namespace: NamespaceType,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  eventEmitter.emit("namespace", namespace);
  for (const model of namespace.models.values()) {
    navigateModelType(model, eventEmitter, visited);
  }
  for (const operation of namespace.operations.values()) {
    navigateOperationType(operation, eventEmitter, visited);
  }
  for (const subNamespace of namespace.namespaces.values()) {
    navigateNamespaceType(subNamespace, eventEmitter, visited);
  }
}

function checkVisited(visited: Set<any>, item: any) {
  if (visited.has(item)) {
    return true;
  }
  visited.add(item);
  return false;
}

function navigateOperationType(
  operation: OperationType,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  if (checkVisited(visited, operation)) {
    return;
  }
  eventEmitter.emit("operation", operation);
}

function navigateModelType(
  model: ModelType,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  if (checkVisited(visited, model)) {
    return;
  }
  eventEmitter.emit("model", model);
  for (const property of model.properties.values()) {
    navigateModelTypeProperty(property, eventEmitter, visited);
  }
  if (model.baseModel) {
    navigateModelType(model.baseModel, eventEmitter, visited);
  }
}

function navigateModelTypeProperty(
  property: ModelTypeProperty,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  if (checkVisited(visited, property)) {
    return;
  }
  eventEmitter.emit("modelProperty", property);
  navigateType(property.type, eventEmitter, visited);
}

function navigateArrayType(
  array: ArrayType,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  if (checkVisited(visited, array)) {
    return;
  }
  eventEmitter.emit("array", array);
  navigateType(array.elementType, eventEmitter, visited);
}

function navigateEnumType(
  type: EnumType,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  if (checkVisited(visited, type)) {
    return;
  }
  eventEmitter.emit("enum", type);
}

function navigateUnionType(
  type: UnionType,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  if (checkVisited(visited, type)) {
    return;
  }
  eventEmitter.emit("union", type);
  for (const option of type.options) {
    navigateType(option, eventEmitter, visited);
  }
}

function navigateTupleType(
  type: TupleType,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  if (checkVisited(visited, type)) {
    return;
  }
  eventEmitter.emit("tuple", type);
  for (const value of type.values) {
    navigateType(value, eventEmitter, visited);
  }
}

function navigateTemplateParameter(
  type: TemplateParameterType,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  if (checkVisited(visited, type)) {
    return;
  }
  eventEmitter.emit("templateParameter", type);
}

function navigateType(
  type: Type,
  eventEmitter: EventEmitter<SemanticNodeListener>,
  visited: Set<any>
) {
  switch (type.kind) {
    case "Model":
      return navigateModelType(type, eventEmitter, visited);
    case "ModelProperty":
      return navigateModelTypeProperty(type, eventEmitter, visited);
    case "Namespace":
      return navigateNamespaceType(type, eventEmitter, visited);
    case "Array":
      return navigateArrayType(type, eventEmitter, visited);
    case "Enum":
      return navigateEnumType(type, eventEmitter, visited);
    case "Operation":
      return navigateOperationType(type, eventEmitter, visited);
    case "Union":
      return navigateUnionType(type, eventEmitter, visited);
    case "Tuple":
      return navigateTupleType(type, eventEmitter, visited);
    case "TemplateParameter":
      return navigateTemplateParameter(type, eventEmitter, visited);
    case "Boolean":
    case "EnumMember":
    case "Intrinsic":
    case "Number":
    case "String":
      return;
  }
}

export class EventEmitter<T extends { [key: string]: (...args: any) => any }> {
  private listeners: Map<keyof T, Array<(...args: any[]) => any>> = new Map();

  public on<K extends keyof T>(name: K, listener: (...args: Parameters<T[K]>) => any) {
    const array = this.listeners.get(name);
    if (array) {
      array.push(listener);
    } else {
      this.listeners.set(name, [listener]);
    }
  }

  public emit<K extends keyof T>(name: K, ...args: Parameters<T[K]>) {
    const listeners = this.listeners.get(name);
    if (listeners) {
      for (const listener of listeners) {
        listener(...(args as any));
      }
    }
  }
}

function createEventEmitter(listeners: SemanticNodeListener) {
  const eventEmitter = new EventEmitter<SemanticNodeListener>();
  for (const [name, listener] of Object.entries(listeners)) {
    eventEmitter.on(name as any, listener as any);
  }

  return eventEmitter;
}
