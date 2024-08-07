import {
  createDiagnosticCollector,
  DecoratorContext,
  DiagnosticResult,
  Interface,
  Model,
  ModelProperty,
  Operation,
  Program,
  Scalar,
  setTypeSpecNamespace,
  Type,
} from "@typespec/compiler";
import {
  DefaultRouteProducer,
  getOperationParameters,
  getOperationVerb,
  getRoutePath,
  getRouteProducer,
  HttpOperation,
  HttpOperationParameter,
  HttpOperationParameters,
  HttpVerb,
  joinPathSegments,
  RouteOptions,
  RouteProducerResult,
  setRouteProducer,
} from "@typespec/http";
import {
  ActionDecorator,
  AutoRouteDecorator,
  CollectionActionDecorator,
  ListsResourceDecorator,
  ReadsResourceDecorator,
  ResourceDecorator,
  SegmentOfDecorator,
} from "../generated-defs/TypeSpec.Rest.js";
import {
  ActionSegmentDecorator,
  ResourceLocationDecorator,
} from "../generated-defs/TypeSpec.Rest.Private.js";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
import { getResourceTypeKey } from "./resource.js";

// ----------------- @autoRoute -----------------

function addActionFragment(program: Program, target: Type, pathFragments: string[]) {
  // add the action segment, if present
  const defaultSeparator = "/";
  const actionSegment = getActionSegment(program, target);
  if (actionSegment && actionSegment !== "") {
    const actionSeparator = getActionSeparator(program, target) ?? defaultSeparator;
    pathFragments.push(`${actionSeparator}${actionSegment}`);
  }
}

function addSegmentFragment(program: Program, target: Type, pathFragments: string[]) {
  // Don't add the segment prefix if it is meant to be excluded
  // (empty string means exclude the segment)
  const segment = getSegment(program, target);

  if (segment && segment !== "") {
    pathFragments.push(`/${segment}`);
  }
}

export interface FilteredRouteParam {
  routeParamString?: string;
  excludeFromOperationParams?: boolean;
}

export interface AutoRouteOptions {
  routeParamFilter?: (op: Operation, param: ModelProperty) => FilteredRouteParam | undefined;
}

// TODO: Make this overridable by libraries
const resourceOperationToVerb: any = {
  read: "get",
  create: "post",
  createOrUpdate: "patch",
  createOrReplace: "put",
  update: "patch",
  delete: "delete",
  list: "get",
};

function getResourceOperationHttpVerb(
  program: Program,
  operation: Operation
): HttpVerb | undefined {
  const resourceOperation = getResourceOperation(program, operation);
  return (
    getOperationVerb(program, operation) ??
    (resourceOperation && resourceOperationToVerb[resourceOperation.operation]) ??
    (getActionDetails(program, operation) || getCollectionActionDetails(program, operation)
      ? "post"
      : undefined)
  );
}

function autoRouteProducer(
  program: Program,
  operation: Operation,
  parentSegments: string[],
  overloadBase: HttpOperation | undefined,
  options: RouteOptions
): DiagnosticResult<RouteProducerResult> {
  const diagnostics = createDiagnosticCollector();
  const routePath = getRoutePath(program, operation)?.path;
  const segments = [...parentSegments, ...(routePath ? [routePath] : [])];
  const filteredParameters: HttpOperationParameter[] = [];
  const paramOptions = {
    ...(options?.paramOptions ?? {}),
    verbSelector: getResourceOperationHttpVerb,
  };

  const parameters: HttpOperationParameters = diagnostics.pipe(
    getOperationParameters(program, operation, "", undefined, paramOptions)
  );

  for (const httpParam of parameters.parameters) {
    const { type, param, name } = httpParam;
    if (type === "path") {
      addSegmentFragment(program, param, segments);

      const filteredParam = options.autoRouteOptions?.routeParamFilter?.(operation, param);
      if (filteredParam?.routeParamString) {
        segments.push(`/${filteredParam.routeParamString}`);

        if (filteredParam?.excludeFromOperationParams === true) {
          // Skip the rest of the loop so that we don't add the parameter to the final list
          continue;
        }
      } else {
        // Add the path variable for the parameter
        if (param.type.kind === "String") {
          segments.push(`/${param.type.value}`);
          continue; // Skip adding to the parameter list
        } else {
          segments.push(`/{${name}}`);
        }
      }
    }

    // Push all usable parameters to the filtered list
    filteredParameters.push(httpParam);
  }

  // Replace the original parameters with filtered set
  parameters.parameters = filteredParameters;

  // Add the operation's own segment if present
  addSegmentFragment(program, operation, segments);

  // Add the operation's action segment if present
  addActionFragment(program, operation, segments);

  return diagnostics.wrap({
    uriTemplate: joinPathSegments(segments),
    parameters: {
      ...parameters,
      parameters: filteredParameters,
    },
  });
}

const autoRouteKey = createStateSymbol("autoRoute");

/**
 * `@autoRoute` enables automatic route generation for an operation or interface.
 *
 * When applied to an operation, it automatically generates the operation's route based on path parameter
 * metadata.  When applied to an interface, it causes all operations under that scope to have
 * auto-generated routes.
 */
export const $autoRoute: AutoRouteDecorator = (
  context: DecoratorContext,
  entity: Interface | Operation
) => {
  if (entity.kind === "Operation") {
    setRouteProducer(context.program, entity, autoRouteProducer);
  } else {
    for (const [_, op] of entity.operations) {
      // Instantly apply the decorator to the operation
      context.call($autoRoute, op);

      // Manually push the decorator onto the property so that it gets applied
      // to operations which reference the operation with `is`
      op.decorators.push({
        decorator: $autoRoute,
        args: [],
      });
    }
  }

  context.program.stateSet(autoRouteKey).add(entity);
};

export function isAutoRoute(program: Program, entity: Operation | Interface): boolean {
  return program.stateSet(autoRouteKey).has(entity);
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

export const $segmentOf: SegmentOfDecorator = (
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model
) => {
  if ((resourceType.kind as any) === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }

  // Add path segment for resource type key (if it has one)
  const segment = getResourceSegment(context.program, resourceType);
  if (segment) {
    context.call($segment, entity, segment);
  }
};

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
export const $resource: ResourceDecorator = (
  context: DecoratorContext,
  entity: Model,
  collectionName: string
) => {
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
    args: [
      { value: context.program.checker.createLiteralType(collectionName), jsValue: collectionName },
    ],
  });
};

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

function resourceRouteProducer(
  program: Program,
  operation: Operation,
  parentSegments: string[],
  overloadBase: HttpOperation | undefined,
  options: RouteOptions
): DiagnosticResult<RouteProducerResult> {
  // NOTE: The purpose of this producer is to pass along the behavior of the
  // DefaultRouteProducer while setting the appropriate HTTP verb based on any
  // resource operation decorators that have been applied.  This behavior will
  // be overridden by the `autoRouteProducer` if `autoRoute` is also applied to
  // the same operation.

  // Set the OperationVerbSelector to pick verbs based on resource operation type
  const paramOptions = {
    ...(options?.paramOptions ?? {}),
    verbSelector: getResourceOperationHttpVerb,
  };

  return DefaultRouteProducer(program, operation, parentSegments, overloadBase, {
    ...options,
    paramOptions,
  });
}

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

  // Set a custom RouteProducer on the operation if one hasn't already been
  // established yet.  This is intended to translate lifecycle operations to
  // HTTP verbs.
  if (!getRouteProducer(context.program, entity)) {
    setRouteProducer(context.program, entity, resourceRouteProducer);
  }
}

export function getResourceOperation(
  program: Program,
  typespecOperation: Operation
): ResourceOperation | undefined {
  return program.stateMap(resourceOperationsKey).get(typespecOperation);
}

export const $readsResource: ReadsResourceDecorator = (
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model
) => {
  setResourceOperation(context, entity, resourceType, "read");
};

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

export const $listsResource: ListsResourceDecorator = (
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model
) => {
  // Add path segment for resource type key
  context.call($segmentOf, entity, resourceType);

  setResourceOperation(context, entity, resourceType, "list");
};

/**
 * Returns `true` if the given operation is marked as a list operation.
 * @param program the TypeSpec program
 * @param target the target operation
 */
export function isListOperation(program: Program, target: Operation): boolean {
  // Is the given operation a `list` operation?
  return getResourceOperation(program, target)?.operation === "list";
}

function lowerCaseFirstChar(str: string): string {
  return str[0].toLocaleLowerCase() + str.substring(1);
}

function makeActionName(op: Operation, name: string | undefined): ActionDetails {
  return {
    name: lowerCaseFirstChar(name || op.name),
    kind: name ? "specified" : "automatic",
  };
}

const actionsSegmentKey = createStateSymbol("actionSegment");

export const $actionSegment: ActionSegmentDecorator = (
  context: DecoratorContext,
  entity: Operation,
  name: string
) => {
  context.program.stateMap(actionsSegmentKey).set(entity, name);
};

export function getActionSegment(program: Program, entity: Type): string | undefined {
  return program.stateMap(actionsSegmentKey).get(entity);
}

/**
 * Provides details about an action or collection action.
 */
export interface ActionDetails {
  /**
   * The name of the action
   */
  name: string;

  /**
   * Identifies whether the action's name was generated from the original
   * operation name or if it was explicitly specified.
   */
  kind: "automatic" | "specified";
}

const actionsKey = createStateSymbol("actions");
export const $action: ActionDecorator = (
  context: DecoratorContext,
  entity: Operation,
  name?: string
) => {
  if (name === "") {
    reportDiagnostic(context.program, {
      code: "invalid-action-name",
      target: entity,
    });
    return;
  }

  const action = makeActionName(entity, name);
  context.call($actionSegment, entity, action.name);
  context.program.stateMap(actionsKey).set(entity, action);
};

/**
 * Gets the ActionDetails for the specified operation if it has previously been marked with @action.
 */
export function getActionDetails(
  program: Program,
  operation: Operation
): ActionDetails | undefined {
  return program.stateMap(actionsKey).get(operation);
}

/**
 * @deprecated Use getActionDetails instead.
 */
export function getAction(program: Program, operation: Operation): string | null | undefined {
  return getActionDetails(program, operation)?.name;
}

const collectionActionsKey = createStateSymbol("collectionActions");

export const $collectionAction: CollectionActionDecorator = (
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
  name?: string
) => {
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
  context.call($actionSegment, entity, action.name);

  // Update the final name and store it
  action.name = `${segment}/${action.name}`;
  context.program.stateMap(collectionActionsKey).set(entity, action);
};

/**
 * Gets the ActionDetails for the specified operation if it has previously been marked with @collectionAction.
 */
export function getCollectionActionDetails(
  program: Program,
  operation: Operation
): ActionDetails | undefined {
  return program.stateMap(collectionActionsKey).get(operation);
}

/**
 * @deprecated Use getCollectionActionDetails instead.
 */
export function getCollectionAction(
  program: Program,
  operation: Operation
): string | null | undefined {
  return getCollectionActionDetails(program, operation)?.name;
}

const resourceLocationsKey = createStateSymbol("resourceLocations");

export const $resourceLocation: ResourceLocationDecorator = (
  context: DecoratorContext,
  entity: Scalar,
  resourceType: Model
) => {
  if ((resourceType as Type).kind === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }

  context.program.stateMap(resourceLocationsKey).set(entity, resourceType);
};

export function getResourceLocationType(program: Program, entity: Scalar): Model | undefined {
  return program.stateMap(resourceLocationsKey).get(entity);
}

setTypeSpecNamespace("Private", $resourceLocation, $actionSegment, getActionSegment);
