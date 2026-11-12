import type { Program } from "./program.js";
import { isTemplateDeclaration } from "./type-utils.js";
import type {
  Decorator,
  Enum,
  EnumMember,
  FunctionValue,
  Interface,
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
  TemplateParameterAccess,
  Tuple,
  Type,
  TypeListeners,
  Union,
  UnionVariant,
  Value,
} from "./types.js";
import { ListenerFlow } from "./types.js";

/** Control which template and inheritance relationships a semantic graph traversal follows. */
export interface NavigationOptions {
  /**
   * Include uninstantiated template declarations in addition to finished types.
   * @default false
   */
  includeTemplateDeclaration?: boolean;
  /**
   * Follow a model's derived models as well as its base model and property types.
   * @default false
   */
  visitDerivedTypes?: boolean;
}

/** Configure namespace filtering for the callbacks registered during a semantic traversal. */
export interface NamespaceNavigationOptions {
  /**
   * Restrict namespace-bearing callbacks to declarations directly in the selected namespace.
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
 * Filter registered callbacks whose targets have a namespace, including enum members via their enum.
 * Only those callbacks can prune traversal. Register container callbacks (such as `model` when
 * collecting `modelProperty`) or check namespace membership in the callbacks you consume.
 * @param namespace Namespace used to filter callbacks.
 * @param listeners Type listeners.
 * @param options Scope options
 * @returns wrapped listeners that that can be used with `navigateType`
 */
export function scopeNavigationToNamespace<T extends SemanticNodeListener>(
  namespace: Namespace,
  listeners: T,
  options: NamespaceNavigationOptions = {},
): T {
  const wrappedListeners: SemanticNodeListener = {};
  for (const [name, callback] of Object.entries(listeners)) {
    wrappedListeners[name as any as keyof TypeListeners] = (x) => {
      const target = x.kind === "EnumMember" ? x.enum : x;
      if (target !== namespace && "namespace" in target) {
        if (options.skipSubNamespaces && target.namespace !== namespace) {
          return ListenerFlow.NoRecursion;
        }
        if (target.namespace && !isSubNamespace(target.namespace, namespace)) {
          return ListenerFlow.NoRecursion;
        }
      }
      return (callback as any)(x);
    };
  }
  return wrappedListeners as any;
}

/**
 * Traverse types starting at a namespace, filtering supplied callbacks with {@link scopeNavigationToNamespace}.
 * Partial listeners do not guarantee namespace isolation: register namespace-bearing container callbacks
 * to prune references to other namespaces, or check membership in the callbacks you consume.
 */
export function navigateTypesInNamespace(
  namespace: Namespace,
  listeners: SemanticNodeListener,
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
    if (!(namespace.name === "TypeSpec" && subNamespace.name === "Prototypes")) {
      navigateNamespaceType(subNamespace, context);
    }
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

  for (const func of namespace.functionDeclarations.values()) {
    navigateFunctionDeclaration(func, context);
  }

  context.emit("exitNamespace", namespace);
}

function checkVisited(visited: Set<any>, item: Type | Value) {
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

  if (context.options.visitDerivedTypes) {
    for (const derived of model.derivedModels) {
      navigateModelType(derived, context);
    }
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

  context.emit("exitInterface", type);
}

function navigateEnumType(type: Enum, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }

  if (context.emit("enum", type) === ListenerFlow.NoRecursion) return;
  for (const member of type.members.values()) {
    navigateTypeInternal(member, context);
  }

  context.emit("exitEnum", type);
}

function navigateEnumMember(type: EnumMember, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("enumMember", type) === ListenerFlow.NoRecursion) return;
  context.emit("exitEnumMember", type);
}

function navigateUnionType(type: Union, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (!shouldNavigateTemplatableType(context, type)) {
    return;
  }
  if (context.emit("union", type) === ListenerFlow.NoRecursion) return;
  if (type.baseType) {
    navigateTypeInternal(type.baseType, context);
  }
  for (const variant of type.variants.values()) {
    navigateUnionTypeVariant(variant, context);
  }

  context.emit("exitUnion", type);
}

function navigateUnionTypeVariant(type: UnionVariant, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("unionVariant", type) === ListenerFlow.NoRecursion) return;
  navigateTypeInternal(type.type, context);

  context.emit("exitUnionVariant", type);
}

function navigateTupleType(type: Tuple, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("tuple", type) === ListenerFlow.NoRecursion) return;
  for (const value of type.values) {
    navigateTypeInternal(value, context);
  }

  context.emit("exitTuple", type);
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
  context.emit("exitTemplateParameter", type);
}

/** Emit semantic walker events for template parameter access nodes. */
function navigateTemplateParameterAccess(
  type: TemplateParameterAccess,
  context: NavigationContext,
) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (context.emit("templateParameterAccess", type) === ListenerFlow.NoRecursion) return;
  context.emit("exitTemplateParameterAccess", type);
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

function navigateFunctionDeclaration(value: FunctionValue, context: NavigationContext) {
  if (checkVisited(context.visited, value)) {
    return;
  }
  if (context.emit("function", value) === ListenerFlow.NoRecursion) return;
}

function navigateTypeInternal(entity: Type | Value, context: NavigationContext) {
  if (entity.entityKind === "Type") {
    switch (entity.kind) {
      case "Model":
        return navigateModelType(entity, context);
      case "Scalar":
        return navigateScalarType(entity, context);
      case "ModelProperty":
        return navigateModelTypeProperty(entity, context);
      case "Namespace":
        return navigateNamespaceType(entity, context);
      case "Interface":
        return navigateInterfaceType(entity, context);
      case "Enum":
        return navigateEnumType(entity, context);
      case "EnumMember":
        return navigateEnumMember(entity, context);
      case "Operation":
        return navigateOperationType(entity, context);
      case "Union":
        return navigateUnionType(entity, context);
      case "UnionVariant":
        return navigateUnionTypeVariant(entity, context);
      case "Tuple":
        return navigateTupleType(entity, context);
      case "StringTemplate":
        return navigateStringTemplate(entity, context);
      case "StringTemplateSpan":
        return navigateStringTemplateSpan(entity, context);
      case "TemplateParameter":
        return navigateTemplateParameter(entity, context);
      case "TemplateParameterAccess":
        return navigateTemplateParameterAccess(entity, context);
      case "Decorator":
        return navigateDecoratorDeclaration(entity, context);
      case "ScalarConstructor":
        return navigateScalarConstructor(entity, context);
      case "FunctionParameter":
      case "FunctionType":
      case "Boolean":
      case "Intrinsic":
      case "Number":
      case "String":
        return;
      default:
        // Dummy const to ensure we handle all types.
        // If you get an error here, add a case for the new type you added
        const _assertNever: never = entity;
        return;
    }
  } else {
    if (entity.valueKind === "Function") {
      return navigateFunctionDeclaration(entity, context);
    }

    return;
  }
}

/** Find a model property by name, searching base models only when no own property matches. */
export function getProperty(type: Model, propertyName: string): ModelProperty | undefined {
  while (type.baseModel) {
    if (type.properties.has(propertyName)) {
      return type.properties.get(propertyName);
    }
    type = type.baseModel;
  }
  return type.properties.get(propertyName);
}

/** Dispatch typed events synchronously to listeners in their registration order. */
export class EventEmitter<T extends { [key: string]: (...args: any) => any }> {
  private listeners: Map<keyof T, Array<(...args: any[]) => any>> = new Map();

  /** Register another listener; registering the same callback again adds another invocation. */
  public on<K extends keyof T>(name: K, listener: (...args: Parameters<T[K]>) => any) {
    const array = this.listeners.get(name);
    if (array) {
      array.push(listener);
    } else {
      this.listeners.set(name, [listener]);
    }
  }

  /** Invoke listeners for the event, ignoring their return values and propagating thrown errors. */
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
  "templateParameterAccess",
  "exitTemplateParameter",
  "exitTemplateParameterAccess",
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
];
