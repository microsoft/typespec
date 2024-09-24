import type { Program } from "./program.js";
import { isTemplateDeclaration } from "./type-utils.js";
import {
  Decorator,
  Enum,
  Interface,
  ListenerFlow,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Scalar,
  ScalarConstructor,
  SemanticNodeListener,
  StringTemplate,
  StringTemplateSpan,
  TemplateParameter,
  Tuple,
  Type,
  TypeListeners,
  Union,
  UnionVariant,
} from "./types.js";

export interface NavigationOptions {
  /**
   * Skip non instantiated templates.
   */
  includeTemplateDeclaration?: boolean;
}

export interface NamespaceNavigationOptions {
  /**
   * Recursively navigate sub namespaces.
   * @default false
   */
  skipSubNamespaces?: boolean;
}

const defaultOptions = {
  includeTemplateDeclaration: false,
};

/**
 * Navigate all types in the program.
 * @param program Program to navigate.
 * @param listeners Listener called when visiting types.
 * @param options Navigation options.
 */
export function navigateProgram(
  program: Program,
  listeners: SemanticNodeListener,
  options: NavigationOptions = {},
) {
  const context = createNavigationContext(listeners, options);
  context.emit("root", program);

  navigateNamespaceType(program.getGlobalNamespaceType(), context);
}

/**
 * Navigate the given type and all the types that are used in it.
 * @param type Type to navigate.
 * @param listeners Listener for the types found.
 * @param options Navigation options
 */
export function navigateType(
  type: Type,
  listeners: SemanticNodeListener,
  options: NavigationOptions,
) {
  const context = createNavigationContext(listeners, options);
  navigateTypeInternal(type, context);
}

/**
 * Scope the current navigation to the given namespace.
 * @param namespace Namespace the traversal shouldn't leave.
 * @param listeners Type listeners.
 * @param options Scope options
 * @returns wrapped listeners that that can be used with `navigateType`
 */
export function scopeNavigationToNamespace<T extends TypeListeners>(
  namespace: Namespace,
  listeners: T,
  options: NamespaceNavigationOptions = {},
): T {
  const wrappedListeners: TypeListeners = {};
  for (const [name, callback] of Object.entries(listeners)) {
    wrappedListeners[name as any as keyof TypeListeners] = (x) => {
      if (x !== namespace && "namespace" in x) {
        if (options.skipSubNamespaces && x.namespace !== namespace) {
          return ListenerFlow.NoRecursion;
        }
        if (x.namespace && !isSubNamespace(x.namespace, namespace)) {
          return ListenerFlow.NoRecursion;
        }
      }
      return (callback as any)(x);
    };
  }
  return wrappedListeners as any;
}

export function navigateTypesInNamespace(
  namespace: Namespace,
  listeners: TypeListeners,
  options: NamespaceNavigationOptions & NavigationOptions = {},
) {
  navigateType(namespace, scopeNavigationToNamespace(namespace, listeners, options), options);
}

/**
 * Create a Semantic node listener from an event emitter.
 * @param eventEmitter Event emitter.
 * @returns Semantic node listener.
 */
export function mapEventEmitterToNodeListener(
  eventEmitter: EventEmitter<SemanticNodeListener>,
): SemanticNodeListener {
  const listener: SemanticNodeListener = {};
  for (const eventName of eventNames) {
    listener[eventName] = (...args) => {
      eventEmitter.emit(eventName, ...(args as [any]));
    };
  }

  return listener;
}

function isSubNamespace(subNamespace: Namespace, namespace: Namespace): boolean {
  let current: Namespace | undefined = subNamespace;
  while (current !== undefined) {
    if (current === namespace) {
      return true;
    }
    current = current.namespace;
  }
  return false;
}
function createNavigationContext(
  listeners: SemanticNodeListener,
  options: NavigationOptions = {},
): NavigationContext {
  return {
    visited: new Set(),
    emit: (key, ...args) => (listeners as any)[key]?.(...(args as [any])),
    options: computeOptions(options),
  };
}

type ResolvedNavigationOptions = NavigationOptions & typeof defaultOptions;

function computeOptions(options: NavigationOptions): ResolvedNavigationOptions {
  return { ...defaultOptions, ...options };
}

interface NavigationContext<
  T extends { [key: string]: (...args: any) => any } = SemanticNodeListener,
> {
  options: ResolvedNavigationOptions;
  visited: Set<Type>;
  emit<K extends keyof T>(name: K, ...args: Parameters<T[K]>): ListenerFlow | undefined | void;
}

function navigateNamespaceType(namespace: Namespace, context: NavigationContext) {
  if (context.emit("namespace", namespace) === ListenerFlow.NoRecursion) return;
  for (const model of namespace.models.values()) {
    navigateModelType(model, context);
  }
  for (const scalar of namespace.scalars.values()) {
    navigateScalarType(scalar, context);
  }
  for (const operation of namespace.operations.values()) {
    navigateOperationType(operation, context);
  }

  for (const subNamespace of namespace.namespaces.values()) {
    navigateNamespaceType(subNamespace, context);
  }

  for (const union of namespace.unions.values()) {
    navigateUnionType(union, context);
  }

  for (const iface of namespace.interfaces.values()) {
    navigateInterfaceType(iface, context);
  }

  for (const enumType of namespace.enums.values()) {
    navigateEnumType(enumType, context);
  }

  for (const decorator of namespace.decoratorDeclarations.values()) {
    navigateDecoratorDeclaration(decorator, context);
  }
}

function checkVisited(visited: Set<any>, item: Type) {
  if (visited.has(item)) {
    return true;
  }
  visited.add(item);
  return false;
}

function shouldNavigateTemplatableType(
  context: NavigationContext,
  type: Operation | Interface | Model | Union,
) {
  if (context.options.includeTemplateDeclaration) {
    return type.isFinished || isTemplateDeclaration(type);
  } else {
    return type.isFinished;
  }
}
function navigateOperationType(operation: Operation, context: NavigationContext) {
  if (checkVisited(context.visited, operation)) {
    return;
  }
  if (!shouldNavigateTemplatableType(context, operation)) {
    return;
  }
  if (context.emit("operation", operation) === ListenerFlow.NoRecursion) return;
  for (const parameter of operation.parameters.properties.values()) {
    navigateTypeInternal(parameter, context);
  }
  navigateTypeInternal(operation.returnType, context);
  if (operation.sourceOperation) {
    navigateTypeInternal(operation.sourceOperation, context);
  }
  context.emit("exitOperation", operation);
}

function navigateModelType(model: Model, context: NavigationContext) {
  if (checkVisited(context.visited, model)) {
    return;
  }
  if (!shouldNavigateTemplatableType(context, model)) {
    return;
  }
  if (context.emit("model", model) === ListenerFlow.NoRecursion) return;
  for (const property of model.properties.values()) {
    navigateModelTypeProperty(property, context);
  }
  if (model.baseModel) {
    navigateModelType(model.baseModel, context);
  }
  if (model.indexer && model.indexer.value) {
    navigateTypeInternal(model.indexer.value, context);
  }
  context.emit("exitModel", model);
}

function navigateModelTypeProperty(property: ModelProperty, context: NavigationContext) {
  if (checkVisited(context.visited, property)) {
    return;
  }
  if (context.emit("modelProperty", property) === ListenerFlow.NoRecursion) return;
  navigateTypeInternal(property.type, context);
  context.emit("exitModelProperty", property);
}

function navigateScalarType(scalar: Scalar, context: NavigationContext) {
  if (checkVisited(context.visited, scalar)) {
    return;
  }
  if (context.emit("scalar", scalar) === ListenerFlow.NoRecursion) return;
  if (scalar.baseScalar) {
    navigateScalarType(scalar.baseScalar, context);
  }
  for (const constructor of scalar.constructors.values()) {
    navigateScalarConstructor(constructor, context);
  }

  context.emit("exitScalar", scalar);
}

function navigateInterfaceType(type: Interface, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (!shouldNavigateTemplatableType(context, type)) {
    return;
  }

  context.emit("interface", type);
  for (const op of type.operations.values()) {
    navigateOperationType(op, context);
  }
}

function navigateEnumType(type: Enum, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }

  context.emit("enum", type);
}

function navigateUnionType(type: Union, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (!shouldNavigateTemplatableType(context, type)) {
    return;
  }
  if (context.emit("union", type) === ListenerFlow.NoRecursion) return;
  for (const variant of type.variants.values()) {
    navigateUnionTypeVariant(variant, context);
  }
}

function navigateUnionTypeVariant(type: UnionVariant, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("unionVariant", type) === ListenerFlow.NoRecursion) return;
  navigateTypeInternal(type.type, context);
}

function navigateTupleType(type: Tuple, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("tuple", type) === ListenerFlow.NoRecursion) return;
  for (const value of type.values) {
    navigateTypeInternal(value, context);
  }
}
function navigateStringTemplate(type: StringTemplate, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("stringTemplate", type) === ListenerFlow.NoRecursion) return;
  for (const value of type.spans) {
    navigateTypeInternal(value, context);
  }
}
function navigateStringTemplateSpan(type: StringTemplateSpan, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("stringTemplateSpan", type as any) === ListenerFlow.NoRecursion) return;
  navigateTypeInternal(type.type, context);
}

function navigateTemplateParameter(type: TemplateParameter, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("templateParameter", type) === ListenerFlow.NoRecursion) return;
}

function navigateDecoratorDeclaration(type: Decorator, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("decorator", type) === ListenerFlow.NoRecursion) return;
}

function navigateScalarConstructor(type: ScalarConstructor, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("scalarConstructor", type) === ListenerFlow.NoRecursion) return;
}

function navigateTypeInternal(type: Type, context: NavigationContext) {
  switch (type.kind) {
    case "Model":
      return navigateModelType(type, context);
    case "Scalar":
      return navigateScalarType(type, context);
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
    case "StringTemplate":
      return navigateStringTemplate(type, context);
    case "StringTemplateSpan":
      return navigateStringTemplateSpan(type, context);
    case "TemplateParameter":
      return navigateTemplateParameter(type, context);
    case "Decorator":
      return navigateDecoratorDeclaration(type, context);
    case "ScalarConstructor":
      return navigateScalarConstructor(type, context);
    case "Object":
    case "Projection":
    case "Function":
    case "FunctionParameter":
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

const eventNames: Array<keyof SemanticNodeListener> = [
  "root",
  "templateParameter",
  "exitTemplateParameter",
  "scalar",
  "exitScalar",
  "model",
  "exitModel",
  "modelProperty",
  "exitModelProperty",
  "interface",
  "exitInterface",
  "enum",
  "exitEnum",
  "enumMember",
  "exitEnumMember",
  "namespace",
  "exitNamespace",
  "operation",
  "exitOperation",
  "string",
  "exitString",
  "number",
  "exitNumber",
  "boolean",
  "exitBoolean",
  "tuple",
  "exitTuple",
  "union",
  "exitUnion",
  "unionVariant",
  "exitUnionVariant",
  "intrinsic",
  "exitIntrinsic",
  "function",
  "exitFunction",
  "object",
  "exitObject",
  "projection",
  "exitProjection",
];
