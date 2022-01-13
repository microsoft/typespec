import {
  getListOperationType,
  getServiceNamespace,
  InterfaceType,
  isListOperation,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  setDecoratorNamespace,
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./diagnostics.js";
import { getOperationVerb, getPathParamName, hasBody, HttpVerb, isPathParam } from "./http.js";
import { getResourceTypeKey } from "./resource.js";
import { getAction, getResourceOperation, getSegment } from "./rest.js";

export type OperationContainer = NamespaceType | InterfaceType;

export interface OperationDetails {
  path: string;
  pathFragment?: string;
  verb: HttpVerb;
  groupName: string;
  container: OperationContainer;
  parameters: ModelTypeProperty[];
  operation: OperationType;
}

export interface RoutePath {
  path: string;
  isReset: boolean;
}

export function $route(program: Program, entity: Type, path: string) {
  setRoute(program, entity, {
    path,
    isReset: false,
  });
}

export function $routeReset(program: Program, entity: Type, path: string) {
  setRoute(program, entity, {
    path,
    isReset: true,
  });
}

const routeContainerKey = Symbol();
function addRouteContainer(program: Program, entity: Type): void {
  let container = entity.kind === "Operation" ? entity.interface || entity.namespace : entity;
  if (!container) {
    // Somehow the entity doesn't have a container.  This should only happen
    // when a type was created manually and not by the checker.
    throw new Error(`${entity.kind} is not or does not have a container`);
  }

  if (isUninstantiatedTemplateInterface(container)) {
    // Don't register uninstantiated template interfaces
    return;
  }

  program.stateSet(routeContainerKey).add(container);
}

const routesKey = Symbol();
function setRoute(program: Program, entity: Type, details: RoutePath) {
  if (entity.kind !== "Namespace" && entity.kind !== "Interface" && entity.kind !== "Operation") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "route", entityKind: entity.kind },
      target: entity,
    });
    return;
  }

  // Register the container of the operation as one that holds routed operations
  addRouteContainer(program, entity);

  program.stateMap(routesKey).set(entity, details);
}

export function getRoutePath(
  program: Program,
  entity: NamespaceType | InterfaceType | OperationType
): RoutePath | undefined {
  return program.stateMap(routesKey).get(entity);
}

function buildPath(pathFragments: string[]) {
  // Join all fragments with leading and trailing slashes trimmed
  const path = pathFragments.map((r) => r.replace(/(^\/|\/$)/g, "")).join("/");
  return `/${path}`;
}

function addSegmentFragment(program: Program, target: Type, pathFragments: string[]) {
  // Don't add the segment prefix if it is meant to be excluded
  // (empty string means exclude the segment)
  const segment = getSegment(program, target);
  if (segment !== "") {
    pathFragments.push(`/${segment}`);
  }
}

function lowerCaseFirstChar(str: string): string {
  return str[0].toLocaleLowerCase() + str.substring(1);
}

function generatePathFromParameters(
  program: Program,
  operation: OperationType,
  pathFragments: string[],
  parameters: ModelTypeProperty[]
) {
  for (const [_, param] of operation.parameters.properties) {
    if (getPathParamName(program, param)) {
      addSegmentFragment(program, param, pathFragments);

      // Add the path variable for the parameter
      if (param.type.kind === "String") {
        pathFragments.push(`/${param.type.value}`);
        continue; // Skip adding to the parameter list
      } else {
        pathFragments.push(`/{${param.name}}`);
      }
    }

    parameters.push(param);
  }

  // If the operation is marked as a list op, add the collection segment
  if (isListOperation(program, operation)) {
    const resourceType = getListOperationType(program, operation);
    if (resourceType) {
      const resourceKey = getResourceTypeKey(program, resourceType);
      addSegmentFragment(program, resourceKey.keyProperty, pathFragments);
    }
  } else {
    // If it's a create operation, add the collection segment
    const resourceOperation = getResourceOperation(program, operation);
    if (resourceOperation && resourceOperation.operation === "create") {
      const resourceKey = getResourceTypeKey(program, resourceOperation.resourceType);
      addSegmentFragment(program, resourceKey.keyProperty, pathFragments);
    } else {
      // Append the action name if necessary
      const action = getAction(program, operation);
      if (action) {
        pathFragments.push(`/${lowerCaseFirstChar(action!)}`);
      }
    }
  }
}

function getPathForOperation(
  program: Program,
  operation: OperationType,
  routeFragments: string[]
): { path: string; pathFragment?: string; parameters: ModelTypeProperty[] } {
  const parameters: ModelTypeProperty[] = [];
  const pathFragments = [...routeFragments];
  const routePath = getRoutePath(program, operation);
  if (isAutoRoute(program, operation)) {
    // The operation exists within an @autoRoute scope, generate the path
    generatePathFromParameters(program, operation, pathFragments, parameters);
  } else {
    // Prepend any explicit route path
    if (routePath) {
      pathFragments.push(routePath.path);
    }

    // Gather operation parameters
    parameters.push(...Array.from(operation.parameters.properties.values()));

    // Pull out path parameters to verify what's in the path string
    const paramByName = new Map(
      parameters.filter((p) => isPathParam(program, p)).map((p) => [p.name, p])
    );

    // Find path parameter names used in all route fragments
    const declaredPathParams = pathFragments.flatMap(
      (f) => f.match(/\{\w+\}/g)?.map((s) => s.slice(1, -1)) ?? []
    );

    // For each param in the declared path parameters (e.g. /foo/{id} has one, id),
    // delete it because it doesn't need to be added to the path.
    for (const declaredParam of declaredPathParams) {
      const param = paramByName.get(declaredParam);
      if (!param) {
        reportDiagnostic(program, {
          code: "missing-path-param",
          format: { param: declaredParam },
          target: operation,
        });
        continue;
      }

      paramByName.delete(declaredParam);
    }

    // Add any remaining declared path params
    for (const param of paramByName.keys()) {
      pathFragments.push(`{${param}}`);
    }
  }

  return {
    path: buildPath(pathFragments),
    pathFragment: routePath?.path,
    parameters,
  };
}

function verbForOperationName(name: string): HttpVerb | undefined {
  switch (name) {
    case "list":
      return "get";
    case "create":
      return "post";
    case "read":
      return "get";
    case "update":
      return "patch";
    case "delete":
      return "delete";
    case "deleteAll":
      return "delete";
  }

  return undefined;
}

function getVerbForOperation(
  program: Program,
  operation: OperationType,
  parameters: ModelTypeProperty[]
): HttpVerb {
  const resourceOperation = getResourceOperation(program, operation);
  return (
    (resourceOperation && resourceOperationToVerb[resourceOperation.operation]) ||
    getOperationVerb(program, operation) ||
    verbForOperationName(operation.name) ||
    (hasBody(program, parameters) ? "post" : "get")
  );
}

function buildRoutes(
  program: Program,
  container: OperationContainer,
  routeFragments: string[],
  visitedOperations: Set<OperationType>
): OperationDetails[] {
  // Get the route info for this container, if any
  const baseRoute = getRoutePath(program, container);
  const parentFragments = [...routeFragments, ...(baseRoute ? [baseRoute.path] : [])];

  // TODO: Allow overriding the existing resource operation of the same kind

  const operations: OperationDetails[] = [];
  for (const [_, op] of container.operations) {
    // Skip previously-visited operations
    if (visitedOperations.has(op)) {
      continue;
    }

    const route = getPathForOperation(program, op, parentFragments);
    const verb = getVerbForOperation(program, op, route.parameters);
    operations.push({
      path: route.path,
      pathFragment: route.pathFragment,
      verb,
      container,
      groupName: container.name,
      parameters: route.parameters,
      operation: op,
    });
  }

  // Build all child routes and append them to the list, but don't recurse in
  // the global scope because that could pull in unwanted operations
  if (container.kind === "Namespace" && container.name !== "") {
    let children: OperationContainer[] = [
      ...container.namespaces.values(),
      ...container.interfaces.values(),
    ];

    const childRoutes = children.flatMap((child) =>
      buildRoutes(program, child, parentFragments, visitedOperations)
    );
    operations.push.apply(operations, childRoutes);
  }

  return operations;
}

export function getRoutesForContainer(
  program: Program,
  container: OperationContainer,
  visitedOperations: Set<OperationType>
): OperationDetails[] {
  return buildRoutes(program, container, [], visitedOperations);
}

function isUninstantiatedTemplateInterface(maybeInterface: Type): boolean {
  return (
    maybeInterface.kind === "Interface" &&
    maybeInterface.node.templateParameters &&
    maybeInterface.node.templateParameters.length > 0 &&
    (!maybeInterface.templateArguments || maybeInterface.templateArguments.length === 0)
  );
}

export function getAllRoutes(program: Program): OperationDetails[] {
  let operations: OperationDetails[] = [];

  const serviceNamespace = getServiceNamespace(program);
  const containers: Type[] = [
    ...(serviceNamespace ? [serviceNamespace] : []),
    ...Array.from(program.stateSet(routeContainerKey)),
  ];

  const visitedOperations = new Set<OperationType>();
  for (const container of containers) {
    // Is this container a templated interface that hasn't been instantiated?
    if (isUninstantiatedTemplateInterface(container)) {
      // Skip template interface operations
      continue;
    }

    const newOps = getRoutesForContainer(
      program,
      container as OperationContainer,
      visitedOperations
    );

    // Make sure we don't visit the same operations again
    newOps.forEach((o) => visitedOperations.add(o.operation));

    // Accumulate the new operations
    operations = [...operations, ...newOps];
  }

  return operations;
}

// TODO: Make this overridable by libraries
const resourceOperationToVerb: any = {
  read: "get",
  create: "post",
  createOrUpdate: "put",
  update: "patch",
  delete: "delete",
  list: "get",
};

const autoRouteKey = Symbol();
export function $autoRoute(program: Program, entity: Type) {
  if (entity.kind !== "Namespace" && entity.kind !== "Interface" && entity.kind !== "Operation") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "route", entityKind: entity.kind },
      target: entity,
    });
    return;
  }

  // Register the container of the operation as one that holds routed operations
  addRouteContainer(program, entity);

  program.stateSet(autoRouteKey).add(entity);
}

export function isAutoRoute(
  program: Program,
  target: NamespaceType | InterfaceType | OperationType
): boolean {
  // Loop up through parent scopes (interface, namespace) to see if
  // @autoRoute was used anywhere
  let current: NamespaceType | InterfaceType | OperationType | undefined = target;
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

setDecoratorNamespace("Cadl.Http", $route, $routeReset, $autoRoute);
