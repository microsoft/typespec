// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import type * as http from "node:http";

/** A policy that can be applied to a route or a set of routes. */
export interface Policy {
  /** Optional policy name. */
  name?: string;

  /**
   * Applies the policy to the request.
   *
   * Policies _MUST_ call `next()` to pass the request to the next policy _OR_ call `response.end()` to terminate,
   * and _MUST NOT_ do both.
   *
   * If the policy passes a `request` object to `next()`, that request object will be used instead of the original
   * request object for the remainder of the policy chain. If the policy does _not_ pass a request object to `next()`,
   * the same object that was passed to this policy will be forwarded to the next policy automatically.
   *
   * @param request - The incoming HTTP request.
   * @param response - The outgoing HTTP response.
   * @param next - Calls the next policy in the chain.
   */
  (ctx: HttpContext, next: (request?: http.IncomingMessage) => void): void;
}

/**
 * Create a function from a chain of policies.
 *
 * This returns a single function that will apply the policy chain and eventually call the provided `next()` function.
 *
 * @param name - The name to give to the policy chain function.
 * @param policies - The policies to apply to the request.
 * @param out - The function to call after the policies have been applied.
 */
export function createPolicyChain<Out extends (ctx: HttpContext, ...rest: any[]) => void>(
  name: string,
  policies: Policy[],
  out: Out,
): Out {
  let outParams: any[];
  if (policies.length === 0) {
    return out;
  }

  function applyPolicy(ctx: HttpContext, index: number) {
    if (index >= policies.length) {
      return out(ctx, ...outParams);
    }

    policies[index](ctx, function nextPolicy(nextRequest) {
      applyPolicy(
        {
          ...ctx,
          request: nextRequest ?? ctx.request,
        },
        index + 1,
      );
    });
  }

  return {
    [name](ctx: HttpContext, ...params: any[]) {
      outParams = params;
      applyPolicy(ctx, 0);
    },
  }[name] as Out;
}

/**
 * The type of an error encountered during request validation.
 */
export type ValidationError = string;

/**
 * An object specifying the policies for a given route configuration.
 */
export type RoutePolicies<RouteConfig extends { [k: string]: object }> = {
  [Interface in keyof RouteConfig]?: {
    before?: Policy[];
    after?: Policy[];
    methodPolicies?: {
      [Method in keyof RouteConfig[Interface]]?: Policy[];
    };
  };
};

/**
 * Create a policy chain for a given route.
 *
 * This function calls `createPolicyChain` internally and orders the policies based on the route configuration.
 *
 * Interface-level `before` policies run first, then method-level policies, then Interface-level `after` policies.
 *
 * @param name - The name to give to the policy chain function.
 * @param routePolicies - The policies to apply to the routes (part of the route configuration).
 * @param interfaceName - The name of the interface that the route belongs to.
 * @param methodName - The name of the method that the route corresponds to.
 * @param out - The function to call after the policies have been applied.
 */
export function createPolicyChainForRoute<
  RouteConfig extends { [k: string]: object },
  InterfaceName extends keyof RouteConfig,
  Out extends (ctx: HttpContext, ...rest: any[]) => void,
>(
  name: string,
  routePolicies: RoutePolicies<RouteConfig>,
  interfaceName: InterfaceName,
  methodName: keyof RouteConfig[InterfaceName],
  out: Out,
): Out {
  return createPolicyChain(
    name,
    [
      ...(routePolicies[interfaceName]?.before ?? []),
      ...(routePolicies[interfaceName]?.methodPolicies?.[methodName] ?? []),
      ...(routePolicies[interfaceName]?.after ?? []),
    ],
    out,
  );
}

/**
 * Options for configuring a router with additional functionality.
 */
export interface RouterOptions<
  RouteConfig extends { [k: string]: object } = { [k: string]: object },
> {
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
   * Policies _MUST_ call `next()` to pass the request to the next policy _OR_ call `response.end()` to terminate
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
   * Policies _MUST_ call `next()` to pass the request to the next policy _OR_ call `response.end()` to terminate
   * the response and _MUST NOT_ do both.
   */
  routePolicies?: RoutePolicies<RouteConfig>;

  /**
   * A handler for requests where the resource is not found.
   *
   * The router will call this function when no route matches the incoming request.
   *
   * If this handler is not provided, a 404 Not Found response with a text body will be returned.
   *
   * You _MUST_ call `response.end()` to terminate the response.
   *
   * This handler is unreachable when using the Express middleware, as it will forward non-matching requests to the
   * next middleware layer in the stack.
   *
   * @param ctx - The HTTP context for the request.
   */
  onRequestNotFound?: (ctx: HttpContext) => void;

  /**
   * A handler for requests that fail to validate inputs.
   *
   * If this handler is not provided, a 400 Bad Request response with a JSON body containing some basic information
   * about the error will be returned to the client.
   *
   * You _MUST_ call `response.end()` to terminate the response.
   *
   * @param ctx - The HTTP context for the request.
   * @param route - The route that was matched.
   * @param error - The validation error that was thrown.
   */
  onInvalidRequest?: (ctx: HttpContext, route: string, error: ValidationError) => void;

  /**
   * A handler for requests that throw an error during processing.
   *
   * If this handler is not provided, a 500 Internal Server Error response with a text body and no error details will be
   * returned to the client.
   *
   * You _MUST_ call `response.end()` to terminate the response.
   *
   * If this handler itself throws an Error, the router will respond with a 500 Internal Server Error
   *
   * @param ctx - The HTTP context for the request.
   * @param error - The error that was thrown.
   */
  onInternalError?(ctx: HttpContext, error: Error): void;
}

/** Context information for operations carried over the HTTP protocol. */
export interface HttpContext {
  /** The incoming request to the server. */
  request: http.IncomingMessage;
  /** The outgoing response object. */
  response: http.ServerResponse;

  /**
   * Error handling functions provided by the HTTP router. Service implementations may call these methods in case a
   * resource is not found, a request is invalid, or an internal error occurs.
   *
   * These methods will respond to the client with the appropriate status code and message.
   */
  errorHandlers: {
    /**
     * Signals that the requested resource was not found.
     */
    onRequestNotFound: Exclude<RouterOptions["onRequestNotFound"], undefined>;
    /**
     * Signals that the request was invalid.
     */
    onInvalidRequest: Exclude<RouterOptions["onInvalidRequest"], undefined>;
    /**
     * Signals that an internal error occurred.
     */
    onInternalError: Exclude<RouterOptions["onInternalError"], undefined>;
  };
}
