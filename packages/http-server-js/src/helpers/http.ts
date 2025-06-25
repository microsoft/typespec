// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HttpContext } from "./router.js";

export const HTTP_RESPONDER = Symbol.for("@typespec/http-server-js.HttpResponder");

/**
 * A type that can respond to an HTTP request.
 */
export interface HttpResponder {
  /**
   * A function that handles an HTTP request and response.
   *
   * @param context - The HTTP context.
   */
  [HTTP_RESPONDER]: (context: HttpContext) => void;
}

/**
 * Determines if a value is an HttpResponder.
 * @param value - The value to check.
 * @returns `true` if the value is an HttpResponder, otherwise `false`.
 */
export function isHttpResponder(value: unknown): value is HttpResponder {
  return (
    typeof value === "object" &&
    value !== null &&
    HTTP_RESPONDER in value &&
    typeof value[HTTP_RESPONDER] === "function"
  );
}

/**
 * An Error that can respond to an HTTP request if thrown from a route handler.
 */
export class HttpResponderError extends Error implements HttpResponder {
  #statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.#statusCode = statusCode;
  }

  [HTTP_RESPONDER](ctx: HttpContext): void {
    ctx.response.statusCode = this.#statusCode;
    ctx.response.setHeader("Content-Type", "text/plain");
    ctx.response.end(this.message);
  }
}

/**
 * The requested resource was not found.
 */
export class NotFoundError extends HttpResponderError {
  constructor() {
    super(404, "Not Found");
  }
}

/**
 * The request was malformed.
 */
export class BadRequestError extends HttpResponderError {
  constructor() {
    super(400, "Bad Request");
  }
}

/**
 * The request is missing required authentication credentials.
 */
export class UnauthorizedError extends HttpResponderError {
  constructor() {
    super(401, "Unauthorized");
  }
}

/**
 * The request is missing required permissions.
 */
export class ForbiddenError extends HttpResponderError {
  constructor() {
    super(403, "Forbidden");
  }
}

/**
 * The request conflicts with the current state of the server.
 */
export class ConflictError extends HttpResponderError {
  constructor() {
    super(409, "Conflict");
  }
}

/**
 * The server encountered an unexpected condition that prevented it from fulfilling the request.
 */
export class InternalServerError extends HttpResponderError {
  constructor() {
    super(500, "Internal Server Error");
  }
}

/**
 * The server does not support the functionality required to fulfill the request.
 */
export class NotImplementedError extends HttpResponderError {
  constructor() {
    super(501, "Not Implemented");
  }
}
