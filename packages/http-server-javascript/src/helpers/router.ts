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
  (
    request: http.IncomingMessage,
    response: http.ServerResponse,
    next: (request?: http.IncomingMessage) => void
  ): void;
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
export function createPolicyChain<
  Out extends (
    ctx: HttpContext,
    request: http.IncomingMessage,
    response: http.ServerResponse,
    ...rest: any[]
  ) => void,
>(name: string, policies: Policy[], out: Out): Out {
  let outParams: any[];
  if (policies.length === 0) {
    return out;
  }

  function applyPolicy(
    ctx: HttpContext,
    request: http.IncomingMessage,
    response: http.ServerResponse,
    index: number
  ) {
    if (index >= policies.length) {
      return out(ctx, request, response, ...outParams);
    }

    policies[index](request, response, function nextPolicy(nextRequest) {
      applyPolicy(ctx, nextRequest ?? request, response, index + 1);
    });
  }

  return {
    [name](
      ctx: HttpContext,
      request: http.IncomingMessage,
      response: http.ServerResponse,
      ...params: any[]
    ) {
      outParams = params;
      applyPolicy(ctx, request, response, 0);
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
  Out extends (
    ctx: HttpContext,
    request: http.IncomingMessage,
    response: http.ServerResponse,
    ...rest: any[]
  ) => void,
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
      ...(routePolicies[interfaceName]?.after ?? []),
    ],
    out
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
   * A handler for requests that do not match any known route and method.
   *
   * If this handler is not provided, a 404 Not Found response with a text body will be returned.
   *
   * You _MUST_ call `response.end()` to terminate the response.
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
   * You _MUST_ call `response.end()` to terminate the response.
   *
   * @param request - The incoming HTTP request.
   * @param response - The outgoing HTTP response.
   * @param route - The route that was matched.
   * @param error - The validation error that was thrown.
   */
  onInvalidRequest?: (
    request: http.IncomingMessage,
    response: http.ServerResponse,
    route: string,
    error: ValidationError
  ) => void;

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
   * @param error - The error that was thrown.
   * @param request - The incoming HTTP request.
   * @param response - The outgoing HTTP response.
   */
  onInternalError?(
    error: unknown,
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): void;
}

/** Context information for operations carried over the HTTP protocol. */
export interface HttpContext {
  /** The incoming request to the server. */
  request: http.IncomingMessage;
  /** The outgoing response object. */
  response: http.ServerResponse;
}
