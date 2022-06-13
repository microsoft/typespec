import {
  $list,
  createDecoratorDefinition,
  DecoratorContext,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  Type,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./diagnostics.js";
import { getResourceTypeKey } from "./resource.js";

const producesTypesKey = Symbol("producesTypes");

export function $produces(context: DecoratorContext, entity: Type, ...contentTypes: string[]) {
  if (!validateDecoratorTarget(context, entity, "@produces", "Namespace")) {
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
export function $discriminator(context: DecoratorContext, entity: Type, propertyName: string) {
  if (!validateDecoratorTarget(context, entity, "@discriminator", "Model")) {
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

const segmentsKey = Symbol("segments");
const segmentDecorator = createDecoratorDefinition({
  name: "@segment",
  target: ["Model", "ModelProperty", "Operation"],
  args: [{ kind: "String" }],
} as const);
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

export function $segmentOf(context: DecoratorContext, entity: Type, resourceType: Type) {
  if (resourceType.kind === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }
  if (!validateDecoratorTarget(context, resourceType, "@segmentOf", "Model")) {
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

/**
 * `@segmentSeparator` defines the separator string that is inserted between the target's
 * `@segment` and the preceding route path in auto-generated routes.
 *
 * The first argument should be a string that will be inserted into the operation route before the
 * target's `@segment` value.  Can be a string of any length.  Defaults to `/`.
 *
 * `@segmentSeparator` can only be applied to model properties, operation parameters, or operations.
 */
export function $segmentSeparator(context: DecoratorContext, entity: Type, separator: string) {
  if (
    !validateDecoratorTarget(context, entity, "@segmentSeparator", [
      "Model",
      "ModelProperty",
      "Operation",
    ])
  ) {
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

export function setResourceOperation(
  program: Program,
  entity: Type,
  resourceType: Type,
  operation: ResourceOperations
) {
  if (resourceType.kind !== "Model" && resourceType.kind !== "TemplateParameter") {
    reportDiagnostic(program, {
      code: "operation-resource-wrong-type",
      format: { operation, kind: resourceType.kind },
      target: entity,
    });
    return;
  }

  // Only register operations when applied to real model types
  if (resourceType.kind === "Model") {
    program.stateMap(resourceOperationsKey).set(entity, {
      operation,
      resourceType,
    });
  }
}

export function getResourceOperation(
  program: Program,
  cadlOperation: OperationType
): ResourceOperation | undefined {
  return program.stateMap(resourceOperationsKey).get(cadlOperation);
}

export function $readsResource(context: DecoratorContext, entity: Type, resourceType: Type) {
  setResourceOperation(context.program, entity, resourceType, "read");
}

export function $createsResource(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: Type
) {
  // Add path segment for resource type key
  context.call($segmentOf, entity, resourceType);

  setResourceOperation(context.program, entity, resourceType, "create");
}

export function $createsOrUpdatesResource(
  context: DecoratorContext,
  entity: Type,
  resourceType: Type
) {
  setResourceOperation(context.program, entity, resourceType, "createOrUpdate");
}

export function $updatesResource(context: DecoratorContext, entity: Type, resourceType: Type) {
  setResourceOperation(context.program, entity, resourceType, "update");
}

export function $deletesResource(context: DecoratorContext, entity: Type, resourceType: Type) {
  setResourceOperation(context.program, entity, resourceType, "delete");
}

export function $listsResource(
  context: DecoratorContext,
  entity: OperationType,
  resourceType: Type
) {
  // Add the @list decorator too so that collection routes are generated correctly
  context.call($list, entity, resourceType);

  // Add path segment for resource type key
  context.call($segmentOf, entity, resourceType);

  setResourceOperation(context.program, entity, resourceType, "list");
}

function lowerCaseFirstChar(str: string): string {
  return str[0].toLocaleLowerCase() + str.substring(1);
}

function makeActionName(op: OperationType, name: string | undefined): string {
  return lowerCaseFirstChar(name || op.name);
}

const actionsKey = Symbol("actions");
export function $action(context: DecoratorContext, entity: Type, name?: string) {
  if (!validateDecoratorTarget(context, entity, "@action", "Operation")) {
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
