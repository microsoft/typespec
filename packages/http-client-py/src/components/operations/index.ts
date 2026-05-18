import type { Children } from "@alloy-js/core";
import type * as cl from "@typespec/http-client";
import { BasicOperationHandler } from "./basic-operation.jsx";
import { LroOperationHandler } from "./lro-operation.jsx";
import type { OperationHandler } from "./types.js";

/**
 * Ordered list of operation handlers. The first one whose `canHandle` returns
 * `true` for a given operation wins. The basic handler always returns `true`
 * and must come last so it acts as a fallback.
 */
export const operationHandlers: readonly OperationHandler[] = [
  LroOperationHandler,
  BasicOperationHandler,
];

/**
 * Dispatches a client operation to the first handler that claims it. Returns
 * the rendered JSX for the operation's Python method(s).
 */
export function renderClientOperation(operation: cl.ClientOperation): Children {
  for (const handler of operationHandlers) {
    if (handler.canHandle(operation)) {
      return handler.render(operation);
    }
  }
  // Unreachable: `BasicOperationHandler.canHandle` returns true.
  return undefined;
}

export type { OperationHandler } from "./types.js";
