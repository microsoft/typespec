import {
  $list,
  createDecoratorDefinition,
  DecoratorContext,
  DecoratorValidator,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  Type,
} from "@cadl-lang/compiler";
import { getResourceTypeKey } from "./resource.js";

const producesTypesKey = Symbol("producesTypes");

const producesDecorator = createDecoratorDefinition({
  name: "@produces",
  target: "Namespace",
  args: [],
  spreadArgs: {
    kind: "String",
  },
} as const);

export function $produces(
  context: DecoratorContext,
  entity: NamespaceType,
  ...contentTypes: string[]
) {
  if (!producesDecorator.validate(context, entity, contentTypes)) {
    return;
  }

  const values = getProduces(context.program, entity);
  context.program.stateMap(producesTypesKey).set(entity, values.concat(contentTypes));
}

export function getProduces(program: Program, entity: Type): string[] {
  return program.stateMap(producesTypesKey).get(entity) || [];
}

const consumesTypesKey = Symbol("consumesTypes");
const consumeDefinition = createDecoratorDefinition({
  name: "@consumes",
  target: "Namespace",
  args: [],
  spreadArgs: {
    kind: "String",
  },
} as const);
export function $consumes(
  context: DecoratorContext,
  entity: NamespaceType,
  ...contentTypes: string[]
) {
  if (!consumeDefinition.validate(context, entity, contentTypes)) {
    return;
  }

  const values = getConsumes(context.program, entity);
  context.program.stateMap(consumesTypesKey).set(entity, values.concat(contentTypes));
}

export function getConsumes(program: Program, entity: Type): string[] {
  return program.stateMap(consumesTypesKey).get(entity) || [];
}

export interface Discriminator {
  propertyName: string;
}

const discriminatorKey = Symbol("discriminator");

const discriminatorDecorator = createDecoratorDefinition({
  name: "@discriminator",
  target: "Model",
  args: [{ kind: "String" }],
} as const);

export function $discriminator(context: DecoratorContext, entity: ModelType, propertyName: string) {
  if (!discriminatorDecorator.validate(context, entity, [propertyName])) {
    return;
  }

  context.program.stateMap(discriminatorKey).set(entity, propertyName);
}

export function getDiscriminator(program: Program, entity: Type): Discriminator | undefined {
  const propertyName = program.stateMap(discriminatorKey).get(entity);
  if (propertyName) {
    return { propertyName };
  }
  return undefined;
}

const segmentDecorator = createDecoratorDefinition({
  name: "@segment",
  target: ["Model", "ModelProperty", "Operation"],
  args: [{ kind: "String" }],
} as const);

const segmentsKey = Symbol("segments");

/**
 * `@segment` defines the preceding path segment for a `@path` parameter in auto-generated routes
 *
 * The first argument should be a string that will be inserted into the operation route before the
 * path parameter's name field.
 *
 * `@segment` can only be applied to model properties, operation parameters, or operations.
 */
export function $segment(
  context: DecoratorContext,
  entity: ModelType | ModelTypeProperty | OperationType,
  name: string
) {
  if (!segmentDecorator.validate(context, entity, [name])) {
    return;
  }

  context.program.stateMap(segmentsKey).set(entity, name);
}

function getResourceSegment(program: Program, resourceType: ModelType): string | undefined {
  // Add path segment for resource type key (if it has one)
  const resourceKey = getResourceTypeKey(program, resourceType);
  return resourceKey
    ? getSegment(program, resourceKey.keyProperty)
    : getSegment(program, resourceType);
}

const segmentOfDecorator = createDecoratorDefinition({
  name: "@segmentOf",
  target: "Operation",
  args: [{ kind: "Model" }],
} as const);

export function $segmentOf(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: ModelType
) {
  if ((resourceType.kind as any) === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }

  if (!segmentOfDecorator.validate(context, entity, [resourceType])) {
    return;
  }

  // Add path segment for resource type key (if it has one)
  const segment = getResourceSegment(context.program, resourceType);
  if (segment) {
    context.call($segment, entity, segment);
  }
}

export function getSegment(program: Program, entity: Type): string | undefined {
  return program.stateMap(segmentsKey).get(entity);
}

const segmentSeparatorsKey = Symbol("segmentSeparators");

const segmentSeparatorDecorator = createDecoratorDefinition({
  name: "@segmentSeparator",
  target: ["Model", "ModelProperty", "Operation"],
  args: [{ kind: "String" }],
} as const);

/**
 * `@segmentSeparator` defines the separator string that is inserted between the target's
 * `@segment` and the preceding route path in auto-generated routes.
 *
 * The first argument should be a string that will be inserted into the operation route before the
 * target's `@segment` value.  Can be a string of any length.  Defaults to `/`.
 *
 * `@segmentSeparator` can only be applied to model properties, operation parameters, or operations.
 */
export function $segmentSeparator(
  context: DecoratorContext,
  entity: ModelType | ModelTypeProperty | OperationType,
  separator: string
) {
  if (!segmentSeparatorDecorator.validate(context, entity, [separator])) {
    return;
  }

  context.program.stateMap(segmentSeparatorsKey).set(entity, separator);
}

export function getSegmentSeparator(program: Program, entity: Type): string | undefined {
  return program.stateMap(segmentSeparatorsKey).get(entity);
}

export type ResourceOperations =
  | "read"
  | "createOrUpdate"
  | "create"
  | "update"
  | "delete"
  | "list";

export interface ResourceOperation {
  operation: string;
  resourceType: ModelType;
}

const resourceOperationsKey = Symbol("resourceOperations");

interface ResourceOperationValidator extends DecoratorValidator<"Operation", [{ kind: "Model" }]> {}

export function setResourceOperation(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: ModelType,
  operation: ResourceOperations,
  decorator: ResourceOperationValidator
) {
  if ((resourceType as any).kind === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }

  if (!decorator.validate(context, entity, [resourceType])) {
    return;
  }

  context.program.stateMap(resourceOperationsKey).set(entity, {
    operation,
    resourceType,
  });
}

export function getResourceOperation(
  program: Program,
  cadlOperation: OperationType
): ResourceOperation | undefined {
  return program.stateMap(resourceOperationsKey).get(cadlOperation);
}

const readsResourceDecorator = createDecoratorDefinition({
  name: "@readsResource",
  target: "Operation",
  args: [{ kind: "Model" }],
} as const);

export function $readsResource(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: ModelType
) {
  setResourceOperation(context, entity, resourceType, "read", readsResourceDecorator);
}

const createsResourceDecorator = createDecoratorDefinition({
  name: "@createsResource",
  target: "Operation",
  args: [{ kind: "Model" }],
} as const);

export function $createsResource(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: ModelType
) {
  // Add path segment for resource type key
  context.call($segmentOf, entity, resourceType);

  setResourceOperation(context, entity, resourceType, "create", createsResourceDecorator);
}

const createsOrUpdatesResourceDecorator = createDecoratorDefinition({
  name: "@createsOrUpdatesResource",
  target: "Operation",
  args: [{ kind: "Model" }],
} as const);

export function $createsOrUpdatesResource(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: ModelType
) {
  setResourceOperation(
    context,
    entity,
    resourceType,
    "createOrUpdate",
    createsOrUpdatesResourceDecorator
  );
}

const updatesResourceDecorator = createDecoratorDefinition({
  name: "@updatesResource",
  target: "Operation",
  args: [{ kind: "Model" }],
} as const);

export function $updatesResource(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: ModelType
) {
  setResourceOperation(context, entity, resourceType, "update", updatesResourceDecorator);
}

const deletesResourceDecorator = createDecoratorDefinition({
  name: "@deletesResource",
  target: "Operation",
  args: [{ kind: "Model" }],
} as const);

export function $deletesResource(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: ModelType
) {
  setResourceOperation(context, entity, resourceType, "delete", deletesResourceDecorator);
}

const listsResourceDecorator = createDecoratorDefinition({
  name: "@listsResource",
  target: "Operation",
  args: [{ kind: "Model" }],
} as const);

export function $listsResource(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: ModelType
) {
  // Add the @list decorator too so that collection routes are generated correctly
  context.call($list, entity, resourceType);

  // Add path segment for resource type key
  context.call($segmentOf, entity, resourceType);

  setResourceOperation(context, entity, resourceType, "list", listsResourceDecorator);
}

function lowerCaseFirstChar(str: string): string {
  return str[0].toLocaleLowerCase() + str.substring(1);
}

function makeActionName(op: OperationType, name: string | undefined): string {
  return lowerCaseFirstChar(name || op.name);
}

const actionDecorator = createDecoratorDefinition({
  name: "@action",
  target: "Operation",
  args: [{ kind: "String", optional: true }],
} as const);

const actionsKey = Symbol("actions");
export function $action(context: DecoratorContext, entity: OperationType, name?: string) {
  if (!actionDecorator.validate(context, entity, [name])) {
    return;
  }

  // Generate the action name and add it as an operation path segment
  const action = makeActionName(entity, name);
  context.call($segment, entity, action);

  context.program.stateMap(actionsKey).set(entity, action);
}

export function getAction(program: Program, operation: OperationType): string | null | undefined {
  return program.stateMap(actionsKey).get(operation);
}

const collectionActionsKey = Symbol("collectionActions");

const collectionActionDecorator = createDecoratorDefinition({
  name: "@collectionAction",
  target: "Operation",
  args: [{ kind: "Model" }, { kind: "String", optional: true }],
} as const);

export function $collectionAction(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: ModelType,
  name?: string
) {
  if ((resourceType as Type).kind === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }

  if (!collectionActionDecorator.validate(context, entity, [resourceType, name])) {
    return;
  }

  // Generate the segment for the collection combined with the action's name
  const segment = getResourceSegment(context.program, resourceType);
  const segmentSeparator = getSegmentSeparator(context.program, entity) ?? "/";
  const action = `${segment}${segmentSeparator}${makeActionName(entity, name)}`;
  context.call($segment, entity, action);

  // Replace the previous segment separator with slash so that it doesn't get repeated
  context.call($segmentSeparator, entity, "/");

  context.program.stateMap(collectionActionsKey).set(entity, action);
}

export function getCollectionAction(
  program: Program,
  operation: OperationType
): string | null | undefined {
  return program.stateMap(collectionActionsKey).get(operation);
}
