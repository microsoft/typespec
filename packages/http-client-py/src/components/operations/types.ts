import type { Children } from "@alloy-js/core";
import type * as cl from "@typespec/http-client";

/**
 * Pluggable operation handler. Mirrors the `OperationHandler` pattern from
 * `@typespec/http-client-js` so we can dispatch the right Python rendering
 * (basic vs. LRO vs. paging vs. ...) for each TypeSpec operation.
 *
 * The first handler whose `canHandle` returns `true` wins; the global handler
 * order is defined in `index.ts`.
 */
export interface OperationHandler {
  /** A short human-readable name used in diagnostics. */
  readonly name: string;
  /** Whether this handler claims responsibility for the operation. */
  canHandle(operation: cl.ClientOperation): boolean;
  /** Renders the Python method(s) for the operation. */
  render(operation: cl.ClientOperation): Children;
}
