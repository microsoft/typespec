import {
  $list,
  DecoratorContext,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Scalar,
  setTypeSpecNamespace,
  Type,
} from "@typespec/compiler";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
import { getResourceTypeKey } from "./resource.js";

// ----------------- @autoRoute -----------------

const autoRouteKey = createStateSymbol("autoRoute");

/**
 * `@autoRoute` enables automatic route generation for an operation, namespace, or interface.
 *
 * When applied to an operation, it automatically generates the operation's route based on path parameter
 * metadata.  When applied to a namespace or interface, it causes all operations under that scope to have
 * auto-generated routes.
 */

export function $autoRoute(context: DecoratorContext, entity: Namespace | Interface | Operation) {
  context.program.stateSet(autoRouteKey).add(entity);
}

export function isAutoRoute(program: Program, target: Namespace | Interface | Operation): boolean {
  // Loop up through parent scopes (interface, namespace) to see if
  // @autoRoute was used anywhere
  let current: Namespace | Interface | Operation | undefined = target;
  while (current !== undefined) {
    if (program.stateSet(autoRouteKey).has(current)) {
      return true;
    }

    // Navigate up to the parent scope
    if (current.kind === "Namespace" || current.kind === "Interface") {
      current = current.namespace;
    } else if (current.kind === "Operation") {
      current = current.interface || current.namespace;
    }
  }

  return false;
}

// ------------------ @segment ------------------

const segmentsKey = createStateSymbol("segments");

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
  entity: Model | ModelProperty | Operation,
  name: string
) {
  context.program.stateMap(segmentsKey).set(entity, name);
}

function getResourceSegment(program: Program, resourceType: Model): string | undefined {
  // Add path segment for resource type key (if it has one)
  const resourceKey = getResourceTypeKey(program, resourceType);
  return resourceKey
    ? getSegment(program, resourceKey.keyProperty)
    : getSegment(program, resourceType);
}

export function $segmentOf(context: DecoratorContext, entity: Operation, resourceType: Model) {
  if ((resourceType.kind as any) === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
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

const actionSeparatorKey = createStateSymbol("actionSeparator");

/**
 * `@actionSeparator` defines the separator string that is used to precede the action name
 *  in auto-generated actions.
 *
 * `@actionSeparator` can only be applied to model properties, operation parameters, or operations.
 */
export function $actionSeparator(
  context: DecoratorContext,
  entity: Model | ModelProperty | Operation,
  separator: "/" | ":" | "/:"
) {
  context.program.stateMap(actionSeparatorKey).set(entity, separator);
}

/**
 * @param program the TypeSpec program
 * @param entity the target entity
 * @returns the action separator string
 */
export function getActionSeparator(program: Program, entity: Type): string | undefined {
  return program.stateMap(actionSeparatorKey).get(entity);
}

/**
 * `@resource` marks a model as a resource type.
 *
 * The first argument should be the name of the collection that the resources
 * belong to.  For example, a resource type `Widget` might have a collection
 * name of `widgets`.
 *
 * `@resource` can only be applied to models.
 */
export function $resource(context: DecoratorContext, entity: Model, collectionName: string) {
  // Ensure type has a key property
  const key = getResourceTypeKey(context.program, entity);

  // A resource type must have a key property
  if (!key) {
    reportDiagnostic(context.program, {
      code: "resource-missing-key",
      format: {
        modelName: entity.name,
      },
      target: entity,
    });

    return;
  }

  // Apply the @segment decorator with the collection name
  context.call($segment, key.keyProperty, collectionName);

  // Manually push the decorator onto the property so that it's copyable in KeysOf<T>
  key.keyProperty.decorators.push({
    decorator: $segment,
    args: [{ value: context.program.checker.createLiteralType(collectionName) }],
  });
}

export type ResourceOperations =
  | "read"
  | "create"
  | "createOrReplace"
  | "createOrUpdate"
  | "update"
  | "delete"
  | "list";

export interface ResourceOperation {
  operation: string;
  resourceType: Model;
}

const resourceOperationsKey = createStateSymbol("resourceOperations");

export function setResourceOperation(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
  operation: ResourceOperations
) {
  if ((resourceType as any).kind === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }

  context.program.stateMap(resourceOperationsKey).set(entity, {
    operation,
    resourceType,
  });
}

export function getResourceOperation(
  program: Program,
  typespecOperation: Operation
): ResourceOperation | undefined {
  return program.stateMap(resourceOperationsKey).get(typespecOperation);
}

export function $readsResource(context: DecoratorContext, entity: Operation, resourceType: Model) {
  setResourceOperation(context, entity, resourceType, "read");
}

export function $createsResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model
) {
  // Add path segment for resource type key
  context.call($segmentOf, entity, resourceType);

  setResourceOperation(context, entity, resourceType, "create");
}

export function $createsOrReplacesResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model
) {
  setResourceOperation(context, entity, resourceType, "createOrReplace");
}

export function $createsOrUpdatesResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model
) {
  setResourceOperation(context, entity, resourceType, "createOrUpdate");
}

export function $updatesResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model
) {
  setResourceOperation(context, entity, resourceType, "update");
}

export function $deletesResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model
) {
  setResourceOperation(context, entity, resourceType, "delete");
}

export function $listsResource(context: DecoratorContext, entity: Operation, resourceType: Model) {
  // Add the @list decorator too so that collection routes are generated correctly
  context.call($list, entity, resourceType);

  // Add path segment for resource type key
  context.call($segmentOf, entity, resourceType);

  setResourceOperation(context, entity, resourceType, "list");
}

function lowerCaseFirstChar(str: string): string {
  return str[0].toLocaleLowerCase() + str.substring(1);
}

function makeActionName(op: Operation, name: string | undefined): string {
  return lowerCaseFirstChar(name || op.name);
}

const actionsSegmentKey = createStateSymbol("actionSegment");

export function $actionSegment(context: DecoratorContext, entity: Operation, name: string) {
  context.program.stateMap(actionsSegmentKey).set(entity, name);
}

export function getActionSegment(program: Program, entity: Type): string | undefined {
  return program.stateMap(actionsSegmentKey).get(entity);
}

const actionsKey = createStateSymbol("actions");
export function $action(context: DecoratorContext, entity: Operation, name?: string) {
  const action = makeActionName(entity, name);
  context.call($actionSegment, entity, action);
  context.program.stateMap(actionsKey).set(entity, action);
}

export function getAction(program: Program, operation: Operation): string | null | undefined {
  return program.stateMap(actionsKey).get(operation);
}

const collectionActionsKey = createStateSymbol("collectionActions");

export function $collectionAction(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
  name?: string
) {
  if ((resourceType as Type).kind === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }

  // only add the resource portion of the segment
  const segment = getResourceSegment(context.program, resourceType);
  if (segment) {
    context.call($segment, entity, segment);
  }

  const action = makeActionName(entity, name);
  context.call($actionSegment, entity, action);

  context.program.stateMap(collectionActionsKey).set(entity, `${segment}/${action}`);
}

export function getCollectionAction(
  program: Program,
  operation: Operation
): string | null | undefined {
  return program.stateMap(collectionActionsKey).get(operation);
}

const resourceLocationsKey = createStateSymbol("resourceLocations");

export function $resourceLocation(
  context: DecoratorContext,
  entity: Model,
  resourceType: Model
): void {
  if ((resourceType as Type).kind === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }

  context.program.stateMap(resourceLocationsKey).set(entity, resourceType);
}

export function getResourceLocationType(program: Program, entity: Scalar): Model | undefined {
  return program.stateMap(resourceLocationsKey).get(entity);
}

setTypeSpecNamespace("Private", $resourceLocation, $actionSegment, getActionSegment);
