import {
  HttpOperation,
  HttpService,
  HttpVerb,
  OperationContainer,
} from "@typespec/http";
import { HttpContext } from "./feature.js";
import { Module, createModule } from "../ctx.js";
import { Operation, Type } from "@typespec/compiler";
import { bifilter } from "../util/bifilter.js";
import { ReCase, parseCase } from "../util/case.js";
import {
  createOrGetModuleForNamespace,
  emitNamespaceInterfaceReference,
} from "../common/namespace.js";
import { emitTypeReference } from "../common/reference.js";
import { indent } from "../util/indent.js";
import { keywordSafe } from "../util/keywords.js";

/**
 * Common utility types and functions emitted as part of the router definition.
 */
const ROUTER_UTILITIES = `
/** A policy that can be applied to a route or a set of routes. */
interface Policy {
  /** Optional policy name. */
  name?: string;

  /**
   * Applies the policy to the request.
   * 
   * Policies _MUST_ call \`next()\` to pass the request to the next policy _OR_ call \`response.end()\` to terminate,
   * and _MUST NOT_ do both.
   * 
   * If the policy passes a \`request\` object to \`next()\`, that request object will be used instead of the original
   * request object for the remainder of the policy chain. If the policy does _not_ pass a request object to \`next()\`,
   * the same object that was passed to this policy will be forwarded to the next policy automatically.
   * 
   * @param request - The incoming HTTP request.
   * @param response - The outgoing HTTP response.
   * @param next - Calls the next policy in the chain.
   */
  (request: http.IncomingMessage, response: http.ServerResponse, next: (request?: http.IncomingMessage) => void): void;
}

/**
 * Create a function from a chain of policies.
 * 
 * This returns a single function that will apply the policy chain and eventually call the provided \`next()\` function.
 * 
 * @param name - The name to give to the policy chain function.
 * @param policies - The policies to apply to the request.
 * @param out - The function to call after the policies have been applied.
 */
function createPolicyChain<
  Out extends (request: http.IncomingMessage, response: http.ServerResponse, ...rest: any[]) => void
>(
  name: string,
  policies: Policy[],
  out: Out
): Out {
  let outParams;
  if (policies.length === 0) {
    return out;
  }
  
  function applyPolicy(request: http.IncomingMessage, response: http.ServerResponse, index: number) {
    if (index >= policies.length) {
      return out(request, response, ...outParams);
    }

    policies[index](request, response, (nextRequest) => {
      applyPolicy(nextRequest ?? request, response, index + 1);
    });
  }

  return {
    [name](request: http.IncomingMessage, response: http.ServerResponse, ...params) {
      outParams = params;
      applyPolicy(request, response, 0);
    }
  }[name] as Out;
}

/**
 * The type of an error encountered during request validation.
 * 
 * TODO/witemple: Need to define shape of error object in a common location.
 */
type ValidationError = string;

/**
 * An object specifying the policies for a given route configuration.
 */
type RoutePolicies<RouteConfig extends { [k: string]: {} }> = {
  [Interface in keyof RouteConfig]?: {
    before?: Policy[],
    after?: Policy[],
    methodPolicies?: {
      [Method in keyof RouteConfig[Interface]]?: Policy[];
    }
  }
};

/**
 * Create a policy chain for a given route.
 * 
 * This function calls \`createPolicyChain\` internally and orders the policies based on the route configuration.
 * 
 * Interface-level \`before\` policies run first, then method-level policies, then Interface-level \`after\` policies.
 * 
 * @param name - The name to give to the policy chain function.
 * @param routePolicies - The policies to apply to the routes (part of the route configuration).
 * @param interfaceName - The name of the interface that the route belongs to.
 * @param methodName - The name of the method that the route corresponds to.
 * @param out - The function to call after the policies have been applied.
 */
function createPolicyChainForRoute<
  RouteConfig extends { [k: string]: {} },
  InterfaceName extends keyof RouteConfig,
  Out extends (request: http.IncomingMessage, response: http.ServerResponse, ...rest: any[]) => void,
>(
  name: string,
  routePolicies: RoutePolicies<RouteConfig>,
  interfaceName: InterfaceName,
  methodName: keyof RouteConfig[InterfaceName],
  out: Out
): Out {
  return createPolicyChain(
    name,
    [
      ...(routePolicies[interfaceName]?.before ?? []),
      ...(routePolicies[interfaceName]?.methodPolicies?.[methodName] ?? []),
      ...(routePolicies[interfaceName]?.after ?? [])
    ],
    out
  );
}

/**
 * Options for configuring a router with additional functionality.
 */
interface RouterOptions<RouteConfig extends { [k: string]: {} } = {}> {
  /**
   * The base path of the router.
   * 
   * This should include any leading slashes, but not a trailing slash, and should not include any component
   * of the URL authority (e.g. the scheme, host, or port).
   * 
   * Defaults to "".
   */
  basePath?: string;

    /**
   * A list of policies to apply to all routes _before_ routing.
   * 
   * Policies are applied in the order they are listed.
   * 
   * By default, the policy list is empty.
   * 
   * Policies _MUST_ call \`next()\` to pass the request to the next policy _OR_ call \`response.end()\` to terminate
   * the response and _MUST NOT_ do both.
   */
  policies?: Policy[];

  /**
   * A record of policies that apply to specific routes.
   * 
   * The policies are provided as a nested record where the keys are the business-logic interface names, and the values
   * are records of the method names in the given interface and the policies that apply to them.
   * 
   * By default, no additional policies are applied to the routes.
   * 
   * Policies _MUST_ call \`next()\` to pass the request to the next policy _OR_ call \`response.end()\` to terminate
   * the response and _MUST NOT_ do both.
   */
  routePolicies?: RoutePolicies<RouteConfig>;

  /**
   * A handler for requests that do not match any known route and method.
   * 
   * If this handler is not provided, a 404 Not Found response with a text body will be returned.
   * 
   * You _MUST_ call \`response.end()\` to terminate the response.
   * 
   * This handler is unreachable when using the Express middleware, as it will forward non-matching requests to the
   * next middleware layer in the stack.
   * 
   * @param request - The incoming HTTP request.
   * @param response - The outgoing HTTP response.
   */
  onRequestNotFound?: (request: http.IncomingMessage, response: http.ServerResponse) => void;

  /**
   * A handler for requests that fail to validate inputs.
   * 
   * If this handler is not provided, a 400 Bad Request response with a JSON body containing some basic information
   * about the error will be returned to the client.
   * 
   * You _MUST_ call \`response.end()\` to terminate the response.
   * 
   * @param request - The incoming HTTP request.
   * @param response - The outgoing HTTP response.
   * @param route - The route that was matched.
   * @param error - The validation error that was thrown.
   */
  onInvalidRequest?: (request: http.IncomingMessage, response: http.ServerResponse, route: string, error: ValidationError) => void;

  /**
   * A handler for requests that throw an error during processing.
   * 
   * If this handler is not provided, a 500 Internal Server Error response with a text body and no error details will be
   * returned to the client.
   * 
   * You _MUST_ call \`response.end()\` to terminate the response.
   * 
   * If this handler itself throws an Error, the router will respond with a 500 Internal Server Error
   * 
   * @param error - The error that was thrown.
   * @param request - The incoming HTTP request.
   * @param response - The outgoing HTTP response.
   */
  onInternalError?(error: unknown, request: http.IncomingMessage, response: http.ServerResponse): void;
}
`.split(/\r?\n/);

/**
 * Emit a router for the HTTP operations defined in a given service.
 *
 * The generated router will use optimal prefix matching to dispatch requests to the appropriate underlying
 * implementation using the raw server.
 *
 * @param ctx - The emitter context.
 * @param service - The HTTP service to emit a router for.
 * @param serverRawModule - The module that contains the raw server implementation.
 */
export function emitRouter(
  ctx: HttpContext,
  service: HttpService,
  serverRawModule: Module
) {
  const routerModule = createModule("router", ctx.httpModule);

  const routeTree = createRouteTree(ctx, service);

  routerModule.imports.push({
    binder: "* as http",
    from: "node:http",
  });

  routerModule.imports.push({
    binder: "* as serverRaw",
    from: serverRawModule,
  });

  routerModule.declarations.push([
    ...emitRouterDefinition(ctx, service, routeTree, routerModule),
  ]);
}

function* emitRouterDefinition(
  ctx: HttpContext,
  service: HttpService,
  routeTree: RouteTree,
  module: Module
): Iterable<string> {
  const routerName = parseCase(service.namespace.name).pascalCase + "Router";

  const uniqueContainers = new Set(
    service.operations.map((operation) => operation.container)
  );

  const backends = new Map<OperationContainer, [ReCase, string]>();

  for (const container of uniqueContainers) {
    const param = parseCase(container.name);

    const traitConstraint =
      container.kind === "Namespace"
        ? emitNamespaceInterfaceReference(ctx, container, module)
        : emitTypeReference(ctx, container, container, module);

    module.imports.push({
      binder: [param.pascalCase],
      from: createOrGetModuleForNamespace(ctx, container.namespace!),
    });

    backends.set(container, [param, traitConstraint]);
  }

  yield* ROUTER_UTILITIES;

  yield `export interface ${routerName} {`;
  yield `  /**`;
  yield `   * Dispatches the request to the appropriate service based on the request path.`;
  yield `   *`;
  yield `   * This member function may be used directly as a handler for a Node HTTP server.`;
  yield `   *`;
  yield `   * @param request - The incoming HTTP request.`;
  yield `   * @param response - The outgoing HTTP response.`;
  yield `   */`;
  yield `  dispatch(request: http.IncomingMessage, response: http.ServerResponse): void;`;
  yield "";
  yield `  /**`;
  yield `   * An Express middleware function that dispatches the request to the appropriate service based on the request path.`;
  yield `   *`;
  yield `   * This member function may be used directly as an application-level middleware function in an Express app.`;
  yield `   *`;
  yield `   * If the router does not match a route, it will call the \`next\` middleware registered with the application,`;
  yield `   * so it is sensible to insert this middleware at the beginning of the middleware stack.`;
  yield `   *`;
  yield `   * @param req - The incoming HTTP request.`;
  yield `   * @param res - The outgoing HTTP response.`;
  yield `   * @param next - The next middleware function in the stack.`;
  yield `   */`;
  yield `  expressMiddleware(req: http.IncomingMessage, res: http.ServerResponse, next: () => void): void;`;
  yield "}";
  yield "";

  yield `export function create${routerName}(`;

  for (const [param] of backends.values()) {
    yield `  ${param.camelCase}: ${param.pascalCase},`;
  }

  yield `  options: RouterOptions<{`;
  for (const [param] of backends.values()) {
    yield `    ${param.camelCase}: ${param.pascalCase},`;
  }
  yield `  }> = {}`;

  yield `): ${routerName} {`;
  yield `  const onRouteNotFound = options.onRequestNotFound ?? ((request, response) => {`;
  yield `    response.statusCode = 404;`;
  yield `    response.setHeader("Content-Type", "text/plain");`;
  yield `    response.end("Not Found");`;
  yield `  });`;
  yield "";
  yield `  const onInvalidRequest = options.onInvalidRequest ?? ((request, response, route, error) => {`;
  yield `    response.statusCode = 400;`;
  yield `    response.setHeader("Content-Type", "application/json");`;
  yield `    response.end(JSON.stringify({ error }));`;
  yield `  });`;
  yield "";
  yield `  const onInternalError = options.onInternalError ?? ((error, request, response) => {`;
  yield `    response.statusCode = 500;`;
  yield `    response.setHeader("Content-Type", "text/plain");`;
  yield `    response.end("Internal server error.");`;
  yield `  });`;
  yield "";
  yield `  const routePolicies = options.routePolicies ?? {};`;
  yield "";
  yield `  const routeHandlers = {`;

  for (const operation of service.operations) {
    const operationName = parseCase(operation.operation.name);
    const containerName = parseCase(operation.container.name);

    yield `    ${containerName.snakeCase}_${operationName.snakeCase}: createPolicyChainForRoute(`;
    yield `      "${containerName.camelCase + operationName.pascalCase + "Dispatch"}",`;
    yield `      routePolicies,`;
    yield `      "${containerName.camelCase}",`;
    yield `      "${operationName.camelCase}",`;
    yield `      serverRaw.${containerName.snakeCase}_${operationName.snakeCase},`;
    yield `    ),`;
  }

  yield `  } as const;`;
  yield "";
  yield `  const dispatch = createPolicyChain("${routerName}Dispatch", options.policies ?? [], async function(request, response, onRouteNotFound) {`;
  yield `    const url = new URL(request.url, \`http://\${request.headers.host}\`);`;
  yield `    let path = url.pathname;`;
  yield "";

  yield* indent(indent(emitRouteHandler(ctx, routeTree, backends, module)));

  yield "";

  yield `    return onRouteNotFound(request, response);`;
  yield `  });`;
  yield "";
  yield `  return {`;
  yield `    dispatch(request, response) { return dispatch(request, response, onRouteNotFound); },`;
  yield `    expressMiddleware: function (req, res, next) { dispatch(req, res, function () { next(); }); },`;
  yield "  }";
  yield "}";
}

function* emitRouteHandler(
  ctx: HttpContext,
  routeTree: RouteTree,
  backends: Map<OperationContainer, [ReCase, string]>,
  module: Module
): Iterable<string> {
  const mustTerminate = routeTree.edges.length === 0 && !routeTree.bind;

  yield `if (path.length === 0) {`;
  if (routeTree.operations.length > 0) {
    yield* indent(
      emitRouteOperationDispatch(ctx, routeTree.operations, backends)
    );
  } else {
    // Not found
    yield `  return onRouteNotFound(request, response);`;
  }
  yield `}`;

  if (mustTerminate) {
    // Not found
    yield "else {";
    yield `  return onRouteNotFound(request, response);`;
    yield `}`;
    return;
  }

  for (const [edge, nextTree] of routeTree.edges) {
    const edgePattern = edge.length === 1 ? `'${edge}'` : JSON.stringify(edge);
    yield `else if (path.startsWith(${edgePattern})) {`;
    yield `  path = path.slice(${edge.length});`;
    yield* indent(emitRouteHandler(ctx, nextTree, backends, module));
    yield "}";
  }

  if (routeTree.bind) {
    const [parameterSet, nextTree] = routeTree.bind;
    const parameters = [...parameterSet];

    yield `else {`;
    const paramName = parameters.length === 1 ? parameters[0] : "param";
    yield `  const [${paramName}, rest] = path.split("/", 1);`;
    yield `  path = rest ?? "";`;
    if (parameters.length !== 1) {
      for (const p of parameters) {
        yield `  const ${parseCase(p).camelCase} = param;`;
      }
    }
    yield* indent(emitRouteHandler(ctx, nextTree, backends, module));

    yield `}`;
  }
}

function* emitRouteOperationDispatch(
  ctx: HttpContext,
  operations: RouteOperation[],
  backends: Map<OperationContainer, [ReCase, string]>
): Iterable<string> {
  yield `switch (request.method) {`;
  for (const operation of operations) {
    const [backend] = backends.get(operation.container)!;
    const operationName = keywordSafe(
      backend.snakeCase + "_" + parseCase(operation.operation.name).snakeCase
    );

    const backendMemberName = backend.camelCase;

    const parameters =
      operation.parameters.length > 0
        ? ", " +
          operation.parameters
            .map((param) => parseCase(param.name).camelCase)
            .join(", ")
        : "";

    yield `  case ${JSON.stringify(operation.verb.toUpperCase())}:`;
    yield `    return routeHandlers.${operationName}(request, response, ${backendMemberName}${parameters});`;
  }

  yield `  default:`;
  yield `    return onRouteNotFound(request, response);`;

  yield "}";
}

/**
 * A tree of routes in an HTTP router domain.
 */
interface RouteTree {
  /**
   * A list of operations that can be dispatched at this node.
   */
  operations: RouteOperation[];
  /**
   * A set of parameters that are bound in this position before proceeding along the edges.
   */
  bind?: [Set<string>, RouteTree];
  /**
   * A list of edges that can be taken from this node.
   */
  edges: RouteTreeEdge[];
}

/**
 * An edge in the route tree. The edge contains a literal string prefix that must match before the next node is visited.
 */
type RouteTreeEdge = readonly [string, RouteTree];

/**
 * An operation that may be dispatched at a given tree node.
 */
interface RouteOperation {
  /**
   * The HTTP operation corresponding to this route operation.
   */
  operation: Operation;
  /**
   * The operation's container.
   */
  container: OperationContainer;
  /**
   * The path parameters that the route template for this operation binds.
   */
  parameters: RouteParameter[];
  /**
   * The HTTP verb (GET, PUT, etc.) that this operation requires.
   */
  verb: HttpVerb;
}

/**
 * A single route split into segments of strings and parameters.
 */
interface Route extends RouteOperation {
  segments: RouteSegment[];
}

/**
 * A segment of a single route.
 */
type RouteSegment = string | RouteParameter;

/**
 * A parameter in the route segment with its expected type.
 */
interface RouteParameter {
  name: string;
  type: Type;
}

/**
 * Create a route tree for a given service.
 */
function createRouteTree(ctx: HttpContext, service: HttpService): RouteTree {
  // First get the Route for each operation in the service.
  const routes = service.operations.map(function (operation) {
    const segments = getRouteSegments(ctx, operation);
    return {
      operation: operation.operation,
      container: operation.container,
      verb: operation.verb,
      parameters: segments.filter((segment) => typeof segment !== "string"),
      segments,
    } as Route;
  });

  // Build the tree by iteratively removing common prefixes from the text segments.

  const tree = intoRouteTree(routes);

  return tree;
}

/**
 * Build a route tree from a list of routes.
 *
 * This iteratively removes common segments from the routes and then for all routes matching a given common prefix,
 * builds a nested tree from their subsequent segments.
 *
 * @param routes - the routes to build the tree from
 */
function intoRouteTree(routes: Route[]): RouteTree {
  const [operations, rest] = bifilter(
    routes,
    (route) => route.segments.length === 0
  );
  const [literal, parameterized] = bifilter(
    rest,
    (route) => typeof route.segments[0]! === "string"
  );

  const edgeMap = new Map<string, Route[]>();

  // Group the routes by common prefix

  outer: for (const literalRoute of literal) {
    const segment = literalRoute.segments[0] as string;

    for (const edge of [...edgeMap.keys()]) {
      const prefix = commonPrefix(segment, edge);

      if (prefix.length > 0) {
        const existing = edgeMap.get(edge)!;
        edgeMap.delete(edge);
        edgeMap.set(prefix, [...existing, literalRoute]);
        continue outer;
      }
    }

    edgeMap.set(segment, [literalRoute]);
  }

  const edges = [...edgeMap.entries()].map(
    ([edge, routes]) =>
      [
        edge,
        intoRouteTree(
          routes.map(function removePrefix(route) {
            const [prefix, ...rest] = route.segments as [
              string,
              ...RouteSegment[],
            ];

            if (prefix === edge) {
              return { ...route, segments: rest };
            } else {
              return {
                ...route,
                segments: [prefix.substring(edge.length), ...rest],
              };
            }
          })
        ),
      ] as const
  );

  let bind: [Set<string>, RouteTree] | undefined;

  if (parameterized.length > 0) {
    const parameters = new Set<string>();
    const nextRoutes: Route[] = [];
    for (const parameterizedRoute of parameterized) {
      const [{ name }, ...rest] = parameterizedRoute.segments as [
        RouteParameter,
        ...RouteSegment[],
      ];

      parameters.add(name);
      nextRoutes.push({ ...parameterizedRoute, segments: rest });
    }

    bind = [parameters, intoRouteTree(nextRoutes)];
  }

  return {
    operations,
    bind,
    edges,
  };

  function commonPrefix(a: string, b: string): string {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) {
      i++;
    }
    return a.substring(0, i);
  }
}

function getRouteSegments(
  ctx: HttpContext,
  operation: HttpOperation
): RouteSegment[] {
  // Parse the route template into segments of "prefixes" (i.e. literal strings)
  // and parameters (names enclosed in curly braces). The "/" character does not
  // actually matter for this. We just want to know what the segments of the route
  // are.
  //
  // Examples:
  //  "" => []
  //  "/users" => ["/users"]
  //  "/users/{userId}" => ["/users/", {name: "userId"}]
  //  "/users/{userId}/posts/{postId}" => ["/users/", {name: "userId"}, "/posts/", {name: "postId"}]
  //
  //  TODO/witemple: can this work?
  //  "/users/{userId}-{postId}" => ["/users/", {name: "userId"}, "-", {name: "postId"}]
  //    - It will parse fine as a route segment in this library but will be very difficult to match in the router
  //      implementation, since attempting to expand the parameter may greedily capture characters that are part of
  //      the next segment.
  //
  // TODO/witemple: This is only slightly different from operation.pathSegments in that it preserves the slashes between segments,
  //       making it a much more direct representation of the route template.

  const segments: RouteSegment[] = [];

  const parameterTypeMap = new Map<string, Type>(
    [...operation.parameters.parameters.values()].map(
      (p) =>
        [
          p.param.name,
          p.param.type.kind === "ModelProperty"
            ? p.param.type.type
            : p.param.type,
        ] as const
    )
  );

  let remainingTemplate = operation.path;

  while (remainingTemplate.length > 0) {
    // Scan for next `{` character
    const openBraceIndex = remainingTemplate.indexOf("{");

    if (openBraceIndex === -1) {
      // No more parameters, just add the remaining string as a segment
      segments.push(remainingTemplate);
      break;
    }

    // Add the prefix before the parameter, if there is one
    if (openBraceIndex > 0) {
      segments.push(remainingTemplate.substring(0, openBraceIndex));
    }

    // Scan for next `}` character
    let closeBraceIndex = remainingTemplate.indexOf("}", openBraceIndex);

    if (closeBraceIndex === -1) {
      // TODO/witemple: this _MUST_ be an error in the HTTP layer, so we don't need to raise a diagnostic here?
      segments.push({
        name: remainingTemplate.substring(openBraceIndex + 1),
        type: undefined as any,
      });
      break;
    }

    // Extract the parameter name
    const parameterName = remainingTemplate.substring(
      openBraceIndex + 1,
      closeBraceIndex
    );

    segments.push({
      name: parameterName,
      type: parameterTypeMap.get(parameterName)!,
    });

    // Move to the next segment
    remainingTemplate = remainingTemplate.substring(closeBraceIndex + 1);
  }

  return segments;
}
