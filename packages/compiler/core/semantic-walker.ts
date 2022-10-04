import { Program } from "./program.js";
import { isTemplateDeclaration } from "./type-utils.js";
import {
  Enum,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  SemanticNodeListener,
  TemplateParameter,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "./types.js";

export interface NavigationOptions {
  /**
   * Recursively lookup in sub namespaces.
   * @default true
   */
  recursive?: boolean;

  /**
   * Skip non instantiated templates.
   */
  includeTemplateDeclaration?: boolean;
}

const defaultOptions = {
  recursive: true,
};

export function navigateProgram(
  program: Program,
  listeners: EventEmitter<SemanticNodeListener> | SemanticNodeListener,
  options: NavigationOptions = {}
) {
  const context = createNavigationContext(listeners, options);
  context.emitter.emit("root", program);

  navigateNamespaceType(program.getGlobalNamespaceType(), context);
}

function createNavigationContext(
  listeners: EventEmitter<SemanticNodeListener> | SemanticNodeListener,
  options: NavigationOptions = {}
): NavigationContext {
  const emitter = listeners instanceof EventEmitter ? listeners : createEventEmitter(listeners);

  return {
    visited: new Set(),
    emitter,
    options: computeOptions(options),
  };
}

export function navigateNamespace(
  namespace: Namespace,
  listeners: EventEmitter<Omit<SemanticNodeListener, "root">> | Omit<SemanticNodeListener, "root">,
  options: NavigationOptions = {}
) {
  const context = createNavigationContext(listeners, options);
  navigateNamespaceType(namespace, context);
}

type ResolvedNavigationOptions = NavigationOptions & typeof defaultOptions;

function computeOptions(options: NavigationOptions): ResolvedNavigationOptions {
  return { ...defaultOptions, ...options };
}

interface NavigationContext {
  options: ResolvedNavigationOptions;
  visited: Set<Type>;
  emitter: EventEmitter<SemanticNodeListener>;
}

function navigateNamespaceType(namespace: Namespace, context: NavigationContext) {
  context.emitter.emit("namespace", namespace);
  for (const model of namespace.models.values()) {
    navigateModelType(model, context);
  }
  for (const operation of namespace.operations.values()) {
    navigateOperationType(operation, context);
  }

  if (context.options.recursive) {
    for (const subNamespace of namespace.namespaces.values()) {
      navigateNamespaceType(subNamespace, context);
    }
  }

  for (const union of namespace.unions.values()) {
    navigateUnionType(union, context);
  }

  for (const iface of namespace.interfaces.values()) {
    navigateInterfaceType(iface, context);
  }
}

function checkVisited(visited: Set<any>, item: any) {
  if (visited.has(item)) {
    return true;
  }
  visited.add(item);
  return false;
}

function navigateOperationType(operation: Operation, context: NavigationContext) {
  if (checkVisited(context.visited, operation)) {
    return;
  }
  if (!context.options.includeTemplateDeclaration && isTemplateDeclaration(operation)) {
    return;
  }
  context.emitter.emit("operation", operation);
  for (const parameter of operation.parameters.properties.values()) {
    navigateType(parameter, context);
  }
  navigateType(operation.returnType, context);
}

function navigateModelType(model: Model, context: NavigationContext) {
  if (checkVisited(context.visited, model)) {
    return;
  }
  if (!context.options.includeTemplateDeclaration && isTemplateDeclaration(model)) {
    return;
  }
  context.emitter.emit("model", model);
  for (const property of model.properties.values()) {
    navigateModelTypeProperty(property, context);
  }
  if (model.baseModel) {
    navigateModelType(model.baseModel, context);
  }
  if (model.indexer && model.indexer.value) {
    navigateType(model.indexer.value, context);
  }
  context.emitter.emit("exitModel", model);
}

function navigateModelTypeProperty(property: ModelProperty, context: NavigationContext) {
  if (checkVisited(context.visited, property)) {
    return;
  }
  context.emitter.emit("modelProperty", property);
  navigateType(property.type, context);
}

function navigateInterfaceType(type: Interface, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (!context.options.includeTemplateDeclaration && isTemplateDeclaration(type)) {
    return;
  }

  context.emitter.emit("interface", type);
  for (const op of type.operations.values()) {
    navigateType(op, context);
  }
}

function navigateEnumType(type: Enum, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }

  context.emitter.emit("enum", type);
}

function navigateUnionType(type: Union, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (!context.options.includeTemplateDeclaration && isTemplateDeclaration(type)) {
    return;
  }
  context.emitter.emit("union", type);
  for (const variant of type.variants.values()) {
    navigateType(variant, context);
  }
}

function navigateUnionTypeVariant(type: UnionVariant, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  context.emitter.emit("unionVariant", type);
  navigateType(type.type, context);
}

function navigateTupleType(type: Tuple, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  context.emitter.emit("tuple", type);
  for (const value of type.values) {
    navigateType(value, context);
  }
}

function navigateTemplateParameter(type: TemplateParameter, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  context.emitter.emit("templateParameter", type);
}

function navigateType(type: Type, context: NavigationContext) {
  switch (type.kind) {
    case "Model":
      return navigateModelType(type, context);
    case "ModelProperty":
      return navigateModelTypeProperty(type, context);
    case "Namespace":
      return navigateNamespaceType(type, context);
    case "Interface":
      return navigateInterfaceType(type, context);
    case "Enum":
      return navigateEnumType(type, context);
    case "Operation":
      return navigateOperationType(type, context);
    case "Union":
      return navigateUnionType(type, context);
    case "UnionVariant":
      return navigateUnionTypeVariant(type, context);
    case "Tuple":
      return navigateTupleType(type, context);
    case "TemplateParameter":
      return navigateTemplateParameter(type, context);
    case "Object":
    case "Projection":
    case "Function":
    case "Boolean":
    case "EnumMember":
    case "Intrinsic":
    case "Number":
    case "String":
      return;
    default:
      // Dummy const to ensure we handle all types.
      // If you get an error here, add a case for the new type you added
      const _assertNever: never = type;
      return;
  }
}

// Return property from type, nesting into baseTypes as needed.
export function getProperty(type: Model, propertyName: string): ModelProperty | undefined {
  while (type.baseModel) {
    if (type.properties.has(propertyName)) {
      return type.properties.get(propertyName);
    }
    type = type.baseModel;
  }
  return type.properties.get(propertyName);
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
