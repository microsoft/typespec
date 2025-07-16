import { refkey as ayRefkey, type Refkey } from "@alloy-js/core";

const refKeyPrefix = Symbol.for("emitter-framework:csharp");

/**
 * A wrapper around `refkey` that uses a custom symbol to avoid collisions with
 * other libraries that use `refkey`.
 *
 * @remarks
 *
 * The underlying refkey function is called with the {@link refKeyPrefix} symbol as the first argument.
 *
 * @param args The parameters of the refkey.
 * @returns A refkey object that can be used to identify the value.
 */
export function efRefkey(...args: unknown[]): Refkey {
  if (args.length === 0) {
    return ayRefkey(); // Generates a unique refkey
  }
  return ayRefkey(refKeyPrefix, ...args);
}

/**
 * Creates a refkey for a declaration by combining the provided refkey with an internal
 * refkey generated from the provided arguments.
 *
 * @param refkey The refkey provided by the user to be passed as is.
 * @param args The parameters of the refkey.
 * @returns An array of refkeys that can be passed to an Alloy declaration.
 */
export function declarationRefkeys(refkey?: Refkey | Refkey[], ...args: unknown[]): Refkey[] {
  if (refkey) {
    return [refkey, efRefkey(...args)].flat();
  }
  return [efRefkey(...args)];
}
