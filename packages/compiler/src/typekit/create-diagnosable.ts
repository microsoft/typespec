import { ignoreDiagnostics } from "../core/diagnostics.js";
import { type Diagnostic } from "../core/types.js";
import { type Typekit } from "./define-kit.js";

/**
 * Represents the enhanced function returned by `createDiagnosable`.
 * This function, when called directly, ignores diagnostics.
 * It also has a `withDiagnostics` method to access the original function's behavior.
 * @template F The function type to be wrapped. This should not include diagnostics on the return type.
 */
export type Diagnosable<F extends (...args: any[]) => unknown> = F & {
  /**
   * Returns a tuple of its primary result and any diagnostics.
   */
  withDiagnostics: (...args: Parameters<F>) => [ReturnType<F>, readonly Diagnostic[]];
};

/**
 * Creates a diagnosable function wrapper.
 *
 * The returned function will ignore diagnostics by default.
 * A `withDiagnostics` property is attached to the returned function,
 * allowing access to the original function's return value including diagnostics.
 *
 * @param fn The function to wrap, which must return a tuple `[Result, readonly Diagnostic[]]`.
 * @returns A function that ignores diagnostics by default, with a `withDiagnostics` method.
 */
export function createDiagnosable<P extends unknown[], R>(
  fn: (this: Typekit, ...args: P) => [R, readonly Diagnostic[]],
): Diagnosable<(...args: P) => R> {
  function wrapper(this: Typekit, ...args: P): R {
    return ignoreDiagnostics(fn.apply(this, args));
  }

  wrapper.withDiagnostics = fn;

  return wrapper;
}
