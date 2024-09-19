import { HttpMethod, MockApiForHandler, MockRequestHandler } from "./types.js";

/**
 * Register a GET request for the provided uri.
 * @param uri URI to match.
 * @param func Request handler.
 */
function get<const T extends MockRequestHandler>(uri: string, func: T): MockApiForHandler<T> {
  return request("get", uri, func);
}

/**
 * Register a POST request for the provided uri.
 * @param uri URI to match.
 * @param func Request handler.
 */
function post<T extends MockRequestHandler>(uri: string, func: T): MockApiForHandler<T> {
  return request("post", uri, func);
}

/**
 * Register a PUT request for the provided uri.
 * @param uri URI to match.
 * @param func Request handler.
 */
function put<T extends MockRequestHandler>(uri: string, func: T): MockApiForHandler<T> {
  return request("put", uri, func);
}

/**
 * Register a PATCH request for the provided uri.
 * @param uri URI to match.
 * @param func Request handler.
 */
function patch<T extends MockRequestHandler>(uri: string, func: T): MockApiForHandler<T> {
  return request("patch", uri, func);
}

/**
 * Register a DELETE request for the provided uri.
 * @param uri URI to match.
 * @param func Request handler.
 */
function deleteReq<T extends MockRequestHandler>(uri: string, func: T): MockApiForHandler<T> {
  return request("delete", uri, func);
}

/**
 * Register a Options request for the provided uri.
 * @param uri URI to match.
 * @param func Request handler.
 */
function options<T extends MockRequestHandler>(uri: string, func: T): MockApiForHandler<T> {
  return request("options", uri, func);
}

/**
 * Register a HEAD request for the provided uri.
 * @param uri URI to match.
 * @param name Name of the scenario(For coverage).
 * @param func Request handler.
 */
function head<T extends MockRequestHandler>(uri: string, func: T): MockApiForHandler<T> {
  return request<T>("head", uri, func);
}

/**
 * Register a request for the provided uri.
 * @param method Method to use.
 * @param uri URI to match.
 * @param func Request handler.
 *
 * @note prefer to use the corresponding method method directly instead of `request()`(i.e `get(), post()`)
 */
function request<T extends MockRequestHandler>(
  method: HttpMethod,
  uri: string,
  handler: T,
): MockApiForHandler<T> {
  return { method, uri, handler } as any;
}

export const mockapi = {
  get,
  post,
  put,
  patch,
  delete: deleteReq,
  options,
  head,
  request,
};
