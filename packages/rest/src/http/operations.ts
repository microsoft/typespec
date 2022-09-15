import {
  createDiagnosticCollector,
  Diagnostic,
  DiagnosticCollector,
  getServiceNamespace,
  listOperationsIn,
  Operation,
  Program,
} from "@cadl-lang/compiler";
import { createDiagnostic, reportDiagnostic } from "../lib.js";
import { getAction, getCollectionAction, getResourceOperation } from "../rest.js";
import { getOperationVerb } from "./decorators.js";
import { getResponsesForOperation } from "./responses.js";
import { resolvePathAndParameters } from "./route.js";
import {
  HttpOperation,
  HttpOperationParameters,
  HttpService,
  HttpVerb,
  OperationContainer,
  RouteResolutionOptions,
} from "./types.js";

/**
 * Return the Http Operation details for a given Cadl operation.
 * @param operation Operation
 * @param options Optional option on how to resolve the http details.
 */
export function getHttpOperation(
  program: Program,
  operation: Operation,
  options?: RouteResolutionOptions
): [HttpOperation, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const route = diagnostics.pipe(resolvePathAndParameters(program, operation, options ?? {}));

  const verb = getVerbForOperation(program, operation, route.parameters);
  const responses = diagnostics.pipe(getResponsesForOperation(program, operation));

  return diagnostics.wrap({
    path: route.path,
    verb,
    container: operation.interface ?? operation.namespace ?? program.getGlobalNamespaceType(),
    parameters: route.parameters,
    operation,
    responses,
  });
}

/**
 * Get all the Http Operation in the given container.
 * @param program Program
 * @param container Namespace or interface containing operations
 * @param options Resolution options
 * @returns
 */
export function listHttpOperationsIn(
  program: Program,
  container: OperationContainer,
  options?: RouteResolutionOptions
): [HttpOperation[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const operations = listOperationsIn(container, options?.listOptions);
  const httpOperations = operations.map((x) =>
    diagnostics.pipe(getHttpOperation(program, x, options))
  );
  return diagnostics.wrap(httpOperations);
}

/**
 * Returns all the services defined.
 */
export function getAllHttpServices(
  program: Program,
  options?: RouteResolutionOptions
): [HttpService[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const serviceNamespace = getServiceNamespace(program);
  const httpOperations = diagnostics.pipe(
    listHttpOperationsIn(program, serviceNamespace, {
      ...options,
      listOptions: {
        recursive: serviceNamespace !== program.getGlobalNamespaceType(),
      },
    })
  );

  validateRouteUnique(diagnostics, httpOperations);
  const service: HttpService = {
    namespace: serviceNamespace,
    operations: httpOperations,
  };
  return diagnostics.wrap([service]);
}

/**
 * @deprecated use `getAllHttpServices` or `resolveHttpOperations` manually
 */
export function getAllRoutes(
  program: Program,
  options?: RouteResolutionOptions
): [HttpOperation[], readonly Diagnostic[]] {
  const [services, diagnostics] = getAllHttpServices(program, options);
  return [services[0].operations, diagnostics];
}

export function reportIfNoRoutes(program: Program, routes: HttpOperation[]) {
  if (routes.length === 0) {
    reportDiagnostic(program, {
      code: "no-routes",
      target: program.getGlobalNamespaceType(),
    });
  }
}

export function validateRouteUnique(diagnostics: DiagnosticCollector, operations: HttpOperation[]) {
  const grouped = new Map<string, Map<HttpVerb, HttpOperation[]>>();

  for (const operation of operations) {
    const { verb, path } = operation;
    let map = grouped.get(path);
    if (map === undefined) {
      map = new Map<HttpVerb, HttpOperation[]>();
      grouped.set(path, map);
    }

    let list = map.get(verb);
    if (list === undefined) {
      list = [];
      map.set(verb, list);
    }

    list.push(operation);
  }

  for (const [path, map] of grouped) {
    for (const [verb, routes] of map) {
      if (routes.length >= 2) {
        for (const route of routes) {
          diagnostics.add(
            createDiagnostic({
              code: "duplicate-operation",
              format: { path, verb, operationName: route.operation.name },
              target: route.operation,
            })
          );
        }
      }
    }
  }
}

function getVerbForOperation(
  program: Program,
  operation: Operation,
  parameters: HttpOperationParameters
): HttpVerb {
  const resourceOperation = getResourceOperation(program, operation);
  const verb =
    (resourceOperation && resourceOperationToVerb[resourceOperation.operation]) ??
    getOperationVerb(program, operation) ??
    // TODO: Enable this verb choice to be customized!
    (getAction(program, operation) || getCollectionAction(program, operation) ? "post" : undefined);

  if (verb !== undefined) {
    return verb;
  }

  // If no verb was found by this point, choose a verb based on whether there is
  // a body type for the request
  return parameters.bodyType ? "post" : "get";
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
