import type {
  DecoratorContext,
  DiagnosticResult,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Scalar,
  Type,
} from "@typespec/compiler";
import { createDiagnosticCollector, setTypeSpecNamespace } from "@typespec/compiler";
import type {
  HttpOperation,
  HttpOperationParameter,
  HttpOperationParameters,
  HttpVerb,
} from "@typespec/http";
import {
  addQueryParamsToUriTemplate,
  getOperationParameters,
  getOperationVerb,
  getRoutePath,
  getUriTemplatePathParam,
  joinPathSegments,
} from "@typespec/http";
import type {
  unsafe_RouteOptions as RouteOptions,
  unsafe_RouteProducerResult as RouteProducerResult,
} from "@typespec/http/experimental";
import {
  unsafe_DefaultRouteProducer as DefaultRouteProducer,
  unsafe_getRouteProducer as getRouteProducer,
  unsafe_setRouteProducer as setRouteProducer,
} from "@typespec/http/experimental";
import type {
  ActionDecorator,
  ActionSeparatorDecorator,
  AutoRouteDecorator,
  CollectionActionDecorator,
  ListsResourceDecorator,
  ReadsResourceDecorator,
  ResourceDecorator,
  SegmentOfDecorator,
} from "../generated-defs/TypeSpec.Rest.js";
import type {
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

/** Overrides how one path parameter contributes to an automatically generated route. */
export interface FilteredRouteParam {
  /**
   * Replacement route fragment, without a leading slash, such as `"fixed"` or `"{id}"`.
   * An absent or empty value preserves the default fragment. The parameter's `@segment` prefix is retained.
   */
  routeParamString?: string;
  /**
   * Removes the parameter from the resolved HTTP operation when `true` and a nonempty
   * `routeParamString` is supplied. Defaults to retaining it.
   */
  excludeFromOperationParams?: boolean;
}

/** Customization supplied through HTTP route options when resolving `@autoRoute` operations. */
export interface AutoRouteOptions {
  /**
   * Called for each resolved path parameter to override its route fragment and optionally omit it
   * from the HTTP parameter list. Returning `undefined` uses normal route generation, including
   * substituting string literal values and omitting those literal parameters.
   */
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
  operation: Operation,
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
  options: RouteOptions,
): DiagnosticResult<RouteProducerResult> {
  const diagnostics = createDiagnosticCollector();
  const routePath = getRoutePath(program, operation)?.path;
  const segments = [...parentSegments, ...(routePath ? [routePath] : [])];
  const filteredParameters: HttpOperationParameter[] = [];
  const filteredParamProperties = new Set<ModelProperty>();
  const paramOptions = {
    ...(options?.paramOptions ?? {}),
    verbSelector: getResourceOperationHttpVerb,
  };

  const parameters: HttpOperationParameters = diagnostics.pipe(
    getOperationParameters(program, operation, "", undefined, paramOptions),
  );

  for (const httpParam of parameters.parameters) {
    const { type, param } = httpParam;
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
          segments.push(`${param.type.value}`);
          continue; // Skip adding to the parameter list
        } else {
          segments.push(`${getUriTemplatePathParam(httpParam)}`);
        }
      }
    }

    // Push all usable parameters to the filtered list
    filteredParameters.push(httpParam);
    filteredParamProperties.add(httpParam.param);
  }

  // Replace the original parameters with filtered set
  parameters.parameters = filteredParameters;
  // Remove any header/query/path/cookie properties that aren't in the filtered list
  for (let i = parameters.properties.length - 1; i >= 0; i--) {
    const httpProp = parameters.properties[i];
    if (!["header", "query", "path", "cookie"].includes(httpProp.kind)) {
      continue;
    }
    if (!filteredParamProperties.has(httpProp.property)) {
      parameters.properties.splice(i, 1);
    }
  }

  // Add the operation's own segment if present
  addSegmentFragment(program, operation, segments);

  // Add the operation's action segment if present
  addActionFragment(program, operation, segments);

  const pathPart = joinPathSegments(segments);

  return diagnostics.wrap({
    uriTemplate: addQueryParamsToUriTemplate(pathPart, filteredParameters),
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
  entity: Interface | Operation,
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

/**
 * Returns whether automatic routing was enabled for this operation or interface.
 * Operations receive this marker when `@autoRoute` is applied to their interface as well.
 */
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
 * On an operation, the segment follows its path parameters. On a model, it supplies a resource
 * segment when the model has no key, as used by singleton resources.
 */
export function $segment(
  context: DecoratorContext,
  entity: Model | ModelProperty | Operation,
  name: string,
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

/**
 * Copies a resource's collection segment onto an operation for automatic routing.
 * Uses the key property's segment when a key exists, or the model's segment otherwise.
 * Leaves the operation unchanged if the segment is absent or empty.
 */
export const $segmentOf: SegmentOfDecorator = (
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
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

/**
 * Returns the segment stored on this type, or `undefined` if none was set.
 * An empty string explicitly omits the segment from automatic routes; no resource key lookup is performed.
 */
export function getSegment(program: Program, entity: Type): string | undefined {
  return program.stateMap(segmentsKey).get(entity);
}

const actionSeparatorKey = createStateSymbol("actionSeparator");

/**
 * `@actionSeparator` defines the separator string that is used to precede the action name
 *  in auto-generated actions.
 *
 * `@actionSeparator` can only be applied to operations, interfaces, or namespaces.
 */
export const $actionSeparator: ActionSeparatorDecorator = (
  context: DecoratorContext,
  entity: Operation | Interface | Namespace,
  separator: "/" | ":" | "/:",
) => {
  context.program.stateMap(actionSeparatorKey).set(entity, separator);
};

/**
 * Resolves the action separator on an entity. For operations, checks the operation, its interface,
 * then enclosing namespaces from nearest to outermost; interfaces fall back to enclosing namespaces.
 * A namespace argument checks only that namespace. Returns `undefined` if no separator is found;
 * automatic routing then uses `"/"`.
 *
 * @param program the TypeSpec program
 * @param entity the target entity
 * @returns the action separator string, checking the hierarchy: operation -> interface -> namespace
 */
export function getActionSeparator(program: Program, entity: Type): string | undefined {
  const stateMap = program.stateMap(actionSeparatorKey);

  // First, check if the entity itself has an action separator
  const directSeparator = stateMap.get(entity);
  if (directSeparator !== undefined) {
    return directSeparator;
  }

  // If entity is an operation, check its interface, then namespace
  if (entity.kind === "Operation") {
    // Check the interface
    if (entity.interface) {
      const interfaceSeparator = stateMap.get(entity.interface);
      if (interfaceSeparator !== undefined) {
        return interfaceSeparator;
      }

      // Check the namespace of the interface
      if (entity.interface.namespace) {
        return getNamespaceActionSeparator(program, entity.interface.namespace);
      }
    }

    // Check the namespace directly if no interface
    if (entity.namespace) {
      return getNamespaceActionSeparator(program, entity.namespace);
    }
  }

  // If entity is an interface, check its namespace
  if (entity.kind === "Interface" && entity.namespace) {
    return getNamespaceActionSeparator(program, entity.namespace);
  }

  return undefined;
}

/**
 * Helper function to recursively check namespace hierarchy for action separator
 */
function getNamespaceActionSeparator(program: Program, namespace: Namespace): string | undefined {
  const stateMap = program.stateMap(actionSeparatorKey);

  // Check current namespace
  const separator = stateMap.get(namespace);
  if (separator !== undefined) {
    return separator;
  }

  // Check parent namespace recursively
  if (namespace.namespace) {
    return getNamespaceActionSeparator(program, namespace.namespace);
  }

  return undefined;
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
  collectionName: string,
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

/** Resource lifecycle roles used to select a default HTTP verb for an operation. */
export type ResourceOperations =
  "read" | "create" | "createOrReplace" | "createOrUpdate" | "update" | "delete" | "list";

/** Resource lifecycle metadata recorded on an operation by a resource operation decorator. */
export interface ResourceOperation {
  /** Lifecycle role, such as `"read"` or `"createOrReplace"`, used to select the default HTTP verb. */
  operation: string;
  /** Resource model acted on by the operation. */
  resourceType: Model;
}

const resourceOperationsKey = createStateSymbol("resourceOperations");

function resourceRouteProducer(
  program: Program,
  operation: Operation,
  parentSegments: string[],
  overloadBase: HttpOperation | undefined,
  options: RouteOptions,
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

/**
 * Records an operation's resource and lifecycle role, replacing any previous resource operation metadata.
 * Installs resource-aware routing only if the operation has no route producer already.
 * Explicit HTTP verb decorators take precedence over the lifecycle role's default verb.
 * Unresolved resource template parameters are ignored.
 */
export function setResourceOperation(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
  operation: ResourceOperations,
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

/** Returns an operation's recorded resource and lifecycle role, or `undefined` if none was set. */
export function getResourceOperation(
  program: Program,
  typespecOperation: Operation,
): ResourceOperation | undefined {
  return program.stateMap(resourceOperationsKey).get(typespecOperation);
}

/** Marks an operation as reading one resource, defaulting its HTTP verb to GET. */
export const $readsResource: ReadsResourceDecorator = (
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
) => {
  setResourceOperation(context, entity, resourceType, "read");
};

/**
 * Marks an operation as creating a resource, defaulting its HTTP verb to POST.
 * Also copies the resource's collection segment onto the operation for automatic routing.
 */
export function $createsResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
) {
  // Add path segment for resource type key
  context.call($segmentOf, entity, resourceType);

  setResourceOperation(context, entity, resourceType, "create");
}

/** Marks an operation as creating or replacing a resource, defaulting its HTTP verb to PUT. */
export function $createsOrReplacesResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
) {
  setResourceOperation(context, entity, resourceType, "createOrReplace");
}

/** Marks an operation as creating or updating a resource, defaulting its HTTP verb to PATCH. */
export function $createsOrUpdatesResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
) {
  setResourceOperation(context, entity, resourceType, "createOrUpdate");
}

/** Marks an operation as updating an existing resource, defaulting its HTTP verb to PATCH. */
export function $updatesResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
) {
  setResourceOperation(context, entity, resourceType, "update");
}

/** Marks an operation as deleting a resource, defaulting its HTTP verb to DELETE. */
export function $deletesResource(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
) {
  setResourceOperation(context, entity, resourceType, "delete");
}

/**
 * Marks an operation as listing a resource collection, defaulting its HTTP verb to GET.
 * Also copies the resource's collection segment onto the operation for automatic routing.
 */
export const $listsResource: ListsResourceDecorator = (
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
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

/**
 * Sets the action fragment appended after an operation's other automatic route segments.
 * This stores the fragment without marking the operation as an action or collection action.
 */
export const $actionSegment: ActionSegmentDecorator = (
  context: DecoratorContext,
  entity: Operation,
  name: string,
) => {
  context.program.stateMap(actionsSegmentKey).set(entity, name);
};

/**
 * Returns the stored action route fragment, without its separator, or `undefined` if none was set.
 * This is distinct from collection action metadata, whose name includes the collection segment.
 */
export function getActionSegment(program: Program, entity: Type): string | undefined {
  return program.stateMap(actionsSegmentKey).get(entity);
}

/**
 * Provides details about an action or collection action.
 */
export interface ActionDetails {
  /**
   * Action name with its first character lowercased. For collection action details,
   * this includes the resource segment followed by `"/"`, independently of `@actionSeparator`.
   */
  name: string;

  /**
   * Identifies whether the action's name was generated from the original
   * operation name or if it was explicitly specified.
   */
  kind: "automatic" | "specified";
}

const actionsKey = createStateSymbol("actions");
/**
 * Marks an operation as an action and sets its automatic route fragment.
 * Uses the supplied name or the operation name, lowercasing the first character.
 * An explicitly empty name reports a diagnostic. Automatic routes default to POST unless
 * an explicit verb or resource lifecycle role supplies one.
 */
export const $action: ActionDecorator = (
  context: DecoratorContext,
  entity: Operation,
  name?: string,
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
 * Returns metadata recorded by `@action`, or `undefined` if the operation is not marked as an action.
 */
export function getActionDetails(
  program: Program,
  operation: Operation,
): ActionDetails | undefined {
  return program.stateMap(actionsKey).get(operation);
}

/**
 * Returns the recorded action name, or `undefined` when no action is recorded.
 *
 * @deprecated Use getActionDetails instead.
 */
export function getAction(program: Program, operation: Operation): string | null | undefined {
  return getActionDetails(program, operation)?.name;
}

const collectionActionsKey = createStateSymbol("collectionActions");

/**
 * Marks an operation as an action on a resource collection and adds the collection and action
 * segments to its automatic route. Uses the supplied name or operation name with its first
 * character lowercased. Automatic routes default to POST unless an explicit verb or resource
 * lifecycle role supplies one.
 */
export const $collectionAction: CollectionActionDecorator = (
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
  name?: string,
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
 * Returns metadata recorded by `@collectionAction`, or `undefined` if none was set.
 * The stored name includes the resource segment and `"/"` before the action name, even when
 * automatic routing uses a different action separator.
 */
export function getCollectionActionDetails(
  program: Program,
  operation: Operation,
): ActionDetails | undefined {
  return program.stateMap(collectionActionsKey).get(operation);
}

/**
 * Returns the collection-prefixed action name, or `undefined` when no collection action is recorded.
 *
 * @deprecated Use getCollectionActionDetails instead.
 */
export function getCollectionAction(
  program: Program,
  operation: Operation,
): string | null | undefined {
  return getCollectionActionDetails(program, operation)?.name;
}

const resourceLocationsKey = createStateSymbol("resourceLocations");

/**
 * Associates a string scalar with the resource model whose location it represents.
 * Used by `ResourceLocation<T>`; unresolved resource template parameters are ignored.
 */
export const $resourceLocation: ResourceLocationDecorator = (
  context: DecoratorContext,
  entity: Scalar,
  resourceType: Model,
) => {
  if ((resourceType as Type).kind === "TemplateParameter") {
    // Skip it, this operation is in a templated interface
    return;
  }

  context.program.stateMap(resourceLocationsKey).set(entity, resourceType);
};

/**
 * Returns the resource model associated directly with a location scalar, or `undefined` if none was set.
 * Does not search base scalars; for a scalar extending `ResourceLocation<T>`, query the decorated base scalar.
 */
export function getResourceLocationType(program: Program, entity: Scalar): Model | undefined {
  return program.stateMap(resourceLocationsKey).get(entity);
}

setTypeSpecNamespace("Private", $resourceLocation, $actionSegment, getActionSegment);
