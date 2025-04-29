import { refkey as ayRefkey } from "@alloy-js/core";

export const refKeyPrefix = Symbol.for("emitter-framework:typescript");

/**
 * A wrapper around `refkey` that uses a custom symbol to avoid collisions with
 * other libraries that use `refkey`.
 *
 * @remarks
 *
 * The underlying `refkey` function is called with the {@link refKeyPrefix} symbol as the first argument.
 *
 * @param args The arguments to pass to `refkey`.
 * @returns A `Refkey` object that can be used to identify the value.
 */
export function efRefkey(...args: unknown[]) {
  return ayRefkey(refKeyPrefix, ...args);
}
