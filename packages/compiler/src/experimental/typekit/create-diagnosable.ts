import { ignoreDiagnostics } from "../../core/diagnostics.js";
import { type Diagnostic } from "../../core/types.js";
import { Typekit } from "./define-kit.js";

/**
 * Represents a function that can return diagnostics along with its primary result.
 * @template P The parameters of the function.
 * @template R The primary return type of the function.
 */
export type DiagnosableFunction<P extends unknown[], R> = (
  ...args: P
) => [R, readonly Diagnostic[]];

/**
 * Represents the enhanced function returned by `createDiagnosable`.
 * This function, when called directly, ignores diagnostics.
 * It also has a `withDiagnostics` method to access the original function's behavior.
 * @template P The parameters of the function.
 * @template R The primary return type of the function.
 */
export type Diagnosable<F> = F extends (...args: infer P extends unknown[]) => infer R
  ? {
      (...args: P): R;
      /**
       * Returns a tuple of its primary result and any diagnostics.
       */
      withDiagnostics: DiagnosableFunction<P, R>;
    }
  : never;

/**
 * Creates a diagnosable function wrapper.
 *
 * The returned function will ignore diagnostics by default.
 * A `withDiagnostics` property is attached to the returned function,
 * allowing access to the original function's return value including diagnostics.
 *
 * @param fn The function to wrap, which must return a tuple `[Result, readonly Diagnostic[]]`.
 * @returns A function that ignores diagnostics by default, with a `withDiagnostics` method.
 * @experimental
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
