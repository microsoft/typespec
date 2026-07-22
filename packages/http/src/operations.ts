import {
  createDiagnosticCollector,
  Diagnostic,
  DiagnosticCollector,
  getLocationContext,
  getOverloadedOperation,
  getOverloads,
  listOperationsIn,
  listServices,
  Namespace,
  navigateProgram,
  Operation,
  Program,
} from "@typespec/compiler";
import { getAuthenticationForOperation } from "./auth.js";
import { getAuthentication } from "./decorators.js";
import { isSharedRoute } from "./decorators/shared-route.js";
import { createDiagnostic, reportDiagnostic } from "./lib.js";
import { getResponsesForOperation } from "./responses.js";
import { resolvePathAndParameters } from "./route.js";
import {
  HttpOperation,
  HttpService,
  HttpVerb,
  OperationContainer,
  RouteResolutionOptions,
} from "./types.js";

/** Symbol used as the cache key for program state. */
const httpOperationCacheKey = Symbol.for("@typespec/http.httpOperationCache");

interface CachedHttpOperation {
  httpOperation: HttpOperation;
  diagnostics: readonly Diagnostic[];
}

/**
 * Return the Http Operation details for a given TypeSpec operation.
 * @param operation Operation
 * @param options Optional option on how to resolve the http details.
 */
export function getHttpOperation(
  program: Program,
  operation: Operation,
  options?: RouteResolutionOptions,
): [HttpOperation, readonly Diagnostic[]] {
  // Bypass cache when custom options are provided (e.g. routeParamFilter)
  // because they produce different results for the same operation.
  if (options) {
    return getHttpOperationInternal(program, operation, options, new Map());
  }
  // Only cache during "emitting" stage. Earlier stages (parsing, checking,
  // validating, linting) always compute fresh to match original behavior
  // and avoid interactions with validators/rules that may process operations
  // in different orders or with different context.
  if (program.currentStage !== "emitting") {
    return getHttpOperationInternal(program, operation, undefined, new Map());
  }
  const cache = program.stateMap(httpOperationCacheKey) as Map<Operation, CachedHttpOperation>;
  const existing = cache.get(operation);
  if (existing) {
    return [existing.httpOperation, existing.diagnostics];
  }
  const result = getHttpOperationInternal(program, operation, undefined, new Map());
  cache.set(operation, { httpOperation: result[0], diagnostics: result[1] });
  return result;
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
  options?: RouteResolutionOptions,
): [HttpOperation[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const operations = listOperationsIn(container, options?.listOptions);
  // Local cache shared across operations in this call for overload resolution
  const localCache = new Map<Operation, HttpOperation>();
  const httpOperations = operations.map((x) =>
    diagnostics.pipe(getHttpOperationInternal(program, x, options, localCache)),
  );
  return diagnostics.wrap(httpOperations);
}

/**
 * Returns all the services defined.
 */
export function getAllHttpServices(
  program: Program,
  options?: RouteResolutionOptions,
): [HttpService[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const serviceNamespaces = listServices(program);

  const services: HttpService[] = serviceNamespaces.map((x) =>
    diagnostics.pipe(getHttpService(program, x.type, options)),
  );
  if (serviceNamespaces.length === 0) {
    services.push(
      diagnostics.pipe(getHttpService(program, program.getGlobalNamespaceType(), options)),
    );
  }
  return diagnostics.wrap(services);
}

export function getHttpService(
  program: Program,
  serviceNamespace: Namespace,
  options?: RouteResolutionOptions,
): [HttpService, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const httpOperations = diagnostics.pipe(
    listHttpOperationsIn(program, serviceNamespace, {
      ...options,
      listOptions: {
        recursive: serviceNamespace !== program.getGlobalNamespaceType(),
      },
    }),
  );
  const authentication = getAuthentication(program, serviceNamespace);

  validateRouteUnique(program, diagnostics, httpOperations);

  const service: HttpService = {
    namespace: serviceNamespace,
    operations: httpOperations,
    authentication: authentication,
  };
  return diagnostics.wrap(service);
}

export function reportIfNoRoutes(program: Program, routes: HttpOperation[]) {
  const services = listServices(program);
  // Only warn if there are no services defined anywhere in the program
  if (services.length === 0) {
    navigateProgram(program, {
      namespace: (namespace) => {
        // Skip the global namespace (it has an empty name)
        if (namespace.name === "") {
          return;
        }
        // Only warn on user project namespaces with operations, not library namespaces
        const locationContext = getLocationContext(program, namespace);
        if (namespace.operations.size > 0 && locationContext.type === "project") {
          reportDiagnostic(program, {
            code: "no-service-found",
            format: {
              namespace: namespace.name,
            },
            target: namespace,
          });
        }
      },
    });
  }
}

export function validateRouteUnique(
  program: Program,
  diagnostics: DiagnosticCollector,
  operations: HttpOperation[],
) {
  const grouped = new Map<string, Map<HttpVerb, HttpOperation[]>>();

  for (const operation of operations) {
    const { verb, path } = operation;

    if (operation.overloading !== undefined && isOverloadSameEndpoint(operation as any)) {
      continue;
    }
    if (isSharedRoute(program, operation.operation)) {
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
            }),
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
  cache: Map<Operation, HttpOperation>,
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
      getHttpOperationInternal(program, overloadBase, options, cache),
    );
  }

  const route = diagnostics.pipe(
    resolvePathAndParameters(program, operation, overloading, options ?? {}),
  );
  const responses = diagnostics.pipe(getResponsesForOperation(program, operation));
  const authentication = getAuthenticationForOperation(program, operation);

  const httpOperation: HttpOperation = {
    path: route.path,
    uriTemplate: route.uriTemplate,
    verb: route.parameters.verb,
    container: operation.interface ?? operation.namespace ?? program.getGlobalNamespaceType(),
    parameters: route.parameters,
    responses,
    operation,
    authentication,
  };
  Object.assign(httpOperationRef, httpOperation);

  const overloads = getOverloads(program, operation);
  if (overloads) {
    httpOperationRef.overloads = overloads.map((x) =>
      diagnostics.pipe(getHttpOperationInternal(program, x, options, cache)),
    );
  }

  return diagnostics.wrap(httpOperationRef);
}
