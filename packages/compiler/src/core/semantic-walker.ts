import { isPromise } from "../utils/misc.js";
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
  /**
   * Visit derived types.
   */
  visitDerivedTypes?: boolean;
  asyncMode?: "await" | "await-all" | "no-await";
}

export interface NamespaceNavigationOptions {
  /**
   * Recursively navigate sub namespaces.
   * @default false
   */
  skipSubNamespaces?: boolean;
}

const defaultOptions: NavigationOptions = {
  includeTemplateDeclaration: false,
  asyncMode: "await",
};

/**
 * Navigate all types in the program.
 * TODO: quick update to add async to try in POC, maybe we should expose a different Api for async like navigateProgramAsync?
 * @param program Program to navigate.
 * @param listeners Listener called when visiting types.
 * @param options Navigation options.
 */
export async function navigateProgram(
  program: Program,
  listeners: SemanticNodeListener,
  options: NavigationOptions = {},
) {
  const context = createNavigationContext(listeners, options);
  await context.emit("root", program);

  await navigateNamespaceType(program.getGlobalNamespaceType(), context);

  await context.emit("exitRoot", program);

  if (context.awaited.length > 0 && context.options.asyncMode === "await-all") {
    await Promise.all(context.awaited);
  }
}

/**
 * Navigate the given type and all the types that are used in it.
 * @param type Type to navigate.
 * @param listeners Listener for the types found.
 * @param options Navigation options
 */
export async function navigateType(
  type: Type,
  listeners: SemanticNodeListener,
  options: NavigationOptions,
) {
  const context = createNavigationContext(listeners, options);
  await navigateTypeInternal(type, context);
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

export async function navigateTypesInNamespace(
  namespace: Namespace,
  listeners: TypeListeners,
  options: NamespaceNavigationOptions & NavigationOptions = {},
) {
  await navigateType(namespace, scopeNavigationToNamespace(namespace, listeners, options), options);
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
  const op = computeOptions(options);
  const awaited: Promise<any>[] = [];
  return {
    visited: new Set(),
    awaited,
    emit: async (key, ...args) => {
      const r = (listeners as any)[key]?.(...(args as [any]));
      if (isPromise(r)) {
        if (!op.asyncMode || op.asyncMode === "await") {
          return await r;
        } else if (op.asyncMode === "await-all") {
          awaited.push(Promise.resolve(r));
        }
        return undefined;
      } else {
        return r;
      }
    },
    options: op,
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
  awaited: Promise<ListenerFlow | undefined | void>[];
  emit<K extends keyof T>(
    name: K,
    ...args: Parameters<T[K]>
  ): Promise<ListenerFlow | undefined | void>;
}

async function navigateNamespaceType(namespace: Namespace, context: NavigationContext) {
  if ((await context.emit("namespace", namespace)) === ListenerFlow.NoRecursion) return;
  for (const model of namespace.models.values()) {
    await navigateModelType(model, context);
  }
  for (const scalar of namespace.scalars.values()) {
    await navigateScalarType(scalar, context);
  }
  for (const operation of namespace.operations.values()) {
    await navigateOperationType(operation, context);
  }

  for (const subNamespace of namespace.namespaces.values()) {
    if (!(namespace.name === "TypeSpec" && subNamespace.name === "Prototypes")) {
      await navigateNamespaceType(subNamespace, context);
    }
  }

  for (const union of namespace.unions.values()) {
    await navigateUnionType(union, context);
  }

  for (const iface of namespace.interfaces.values()) {
    await navigateInterfaceType(iface, context);
  }

  for (const enumType of namespace.enums.values()) {
    await navigateEnumType(enumType, context);
  }

  for (const decorator of namespace.decoratorDeclarations.values()) {
    await navigateDecoratorDeclaration(decorator, context);
  }

  await context.emit("exitNamespace", namespace);
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
async function navigateOperationType(operation: Operation, context: NavigationContext) {
  if (checkVisited(context.visited, operation)) {
    return;
  }
  if (!shouldNavigateTemplatableType(context, operation)) {
    return;
  }
  if ((await context.emit("operation", operation)) === ListenerFlow.NoRecursion) return;
  for (const parameter of operation.parameters.properties.values()) {
    await navigateTypeInternal(parameter, context);
  }
  await navigateTypeInternal(operation.returnType, context);
  if (operation.sourceOperation) {
    await navigateTypeInternal(operation.sourceOperation, context);
  }
  await context.emit("exitOperation", operation);
}

async function navigateModelType(model: Model, context: NavigationContext) {
  if (checkVisited(context.visited, model)) {
    return;
  }
  if (!shouldNavigateTemplatableType(context, model)) {
    return;
  }
  if ((await context.emit("model", model)) === ListenerFlow.NoRecursion) return;
  for (const property of model.properties.values()) {
    await navigateModelTypeProperty(property, context);
  }
  if (model.baseModel) {
    await navigateModelType(model.baseModel, context);
  }
  if (model.indexer && model.indexer.value) {
    await navigateTypeInternal(model.indexer.value, context);
  }

  if (context.options.visitDerivedTypes) {
    for (const derived of model.derivedModels) {
      await navigateModelType(derived, context);
    }
  }

  await context.emit("exitModel", model);
}

async function navigateModelTypeProperty(property: ModelProperty, context: NavigationContext) {
  if (checkVisited(context.visited, property)) {
    return;
  }
  if ((await context.emit("modelProperty", property)) === ListenerFlow.NoRecursion) return;
  await navigateTypeInternal(property.type, context);
  await context.emit("exitModelProperty", property);
}

async function navigateScalarType(scalar: Scalar, context: NavigationContext) {
  if (checkVisited(context.visited, scalar)) {
    return;
  }
  if ((await context.emit("scalar", scalar)) === ListenerFlow.NoRecursion) return;
  if (scalar.baseScalar) {
    await navigateScalarType(scalar.baseScalar, context);
  }
  for (const constructor of scalar.constructors.values()) {
    await navigateScalarConstructor(constructor, context);
  }

  await context.emit("exitScalar", scalar);
}

async function navigateInterfaceType(type: Interface, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (!shouldNavigateTemplatableType(context, type)) {
    return;
  }

  await context.emit("interface", type);
  for (const op of type.operations.values()) {
    await navigateOperationType(op, context);
  }

  await context.emit("exitInterface", type);
}

async function navigateEnumType(type: Enum, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }

  await context.emit("enum", type);
  for (const member of type.members.values()) {
    await navigateTypeInternal(member, context);
  }

  await context.emit("exitEnum", type);
}

async function navigateUnionType(type: Union, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if (!shouldNavigateTemplatableType(context, type)) {
    return;
  }
  if ((await context.emit("union", type)) === ListenerFlow.NoRecursion) return;
  for (const variant of type.variants.values()) {
    await navigateUnionTypeVariant(variant, context);
  }

  await context.emit("exitUnion", type);
}

async function navigateUnionTypeVariant(type: UnionVariant, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if ((await context.emit("unionVariant", type)) === ListenerFlow.NoRecursion) return;
  await navigateTypeInternal(type.type, context);

  await context.emit("exitUnionVariant", type);
}

async function navigateTupleType(type: Tuple, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if ((await context.emit("tuple", type)) === ListenerFlow.NoRecursion) return;
  for (const value of type.values) {
    await navigateTypeInternal(value, context);
  }

  await context.emit("exitTuple", type);
}
async function navigateStringTemplate(type: StringTemplate, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if ((await context.emit("stringTemplate", type)) === ListenerFlow.NoRecursion) return;
  for (const value of type.spans) {
    await navigateTypeInternal(value, context);
  }
}
async function navigateStringTemplateSpan(type: StringTemplateSpan, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if ((await context.emit("stringTemplateSpan", type as any)) === ListenerFlow.NoRecursion) return;
  await navigateTypeInternal(type.type, context);
}

async function navigateTemplateParameter(type: TemplateParameter, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if ((await context.emit("templateParameter", type)) === ListenerFlow.NoRecursion) return;
}

async function navigateDecoratorDeclaration(type: Decorator, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if ((await context.emit("decorator", type)) === ListenerFlow.NoRecursion) return;
}

async function navigateScalarConstructor(type: ScalarConstructor, context: NavigationContext) {
  if (checkVisited(context.visited, type)) {
    return;
  }
  if ((await context.emit("scalarConstructor", type)) === ListenerFlow.NoRecursion) return;
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
  "exitRoot",
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
];
