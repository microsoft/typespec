import {
  createDiagnosticCollector,
  Diagnostic,
  DiagnosticCollector,
  getOverloadedOperation,
  getOverloads,
  getServiceNamespace,
  listOperationsIn,
  Operation,
  Program,
} from "@cadl-lang/compiler";
import { createDiagnostic, reportDiagnostic } from "../lib.js";
import { getResponsesForOperation } from "./responses.js";
import { resolvePathAndParameters } from "./route.js";
import {
  HttpOperation,
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
  return getHttpOperationInternal(program, operation, options, new Map());
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

    if (operation.overloading !== undefined && isOverloadSameEndpoint(operation as any)) {
      continue;
    }
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

export function isOverloadSameEndpoint(overload: HttpOperation & { overloading: HttpOperation }) {
  return overload.path === overload.overloading.path && overload.verb === overload.overloading.verb;
}

function getHttpOperationInternal(
  program: Program,
  operation: Operation,
  options: RouteResolutionOptions | undefined,
  cache: Map<Operation, HttpOperation>
): [HttpOperation, readonly Diagnostic[]] {
  const existing = cache.get(operation);
  if (existing) {
    return [existing, []];
  }
  const diagnostics = createDiagnosticCollector();
  const httpOperationRef: HttpOperation = { operation } as any;
  cache.set(operation, httpOperationRef);

  const overloadBase = getOverloadedOperation(program, operation);
  let overloading;
  if (overloadBase) {
    overloading = httpOperationRef.overloading = diagnostics.pipe(
      getHttpOperationInternal(program, overloadBase, options, cache)
    );
  }

  const route = diagnostics.pipe(
    resolvePathAndParameters(program, operation, overloading, options ?? {})
  );
  const responses = diagnostics.pipe(getResponsesForOperation(program, operation));

  const httpOperation: HttpOperation = {
    path: route.path,
    pathSegments: route.pathSegments,
    verb: route.parameters.verb,
    container: operation.interface ?? operation.namespace ?? program.getGlobalNamespaceType(),
    parameters: route.parameters,
    operation,
    responses,
  };
  Object.assign(httpOperationRef, httpOperation);

  const overloads = getOverloads(program, operation);
  if (overloads) {
    httpOperationRef.overloads = overloads.map((x) =>
      diagnostics.pipe(getHttpOperationInternal(program, x, options, cache))
    );
  }

  return diagnostics.wrap(httpOperationRef);
}
