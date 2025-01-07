import { type Program } from "../../core/program.js";
import { Realm } from "../realm.js";

/**
 * A Typekit is a collection of utility functions and namespaces that allow you to work with TypeSpec types.
 *
 * @experimental
 */
export interface Typekit {
  readonly program: Program;
  readonly realm: Realm;
}

/**
 * The prototype object for Typekit instances.
 *
 * @see {@link defineKit}
 *
 * @experimental
 * @internal
 */
export const TypekitPrototype: Record<string, unknown> = {};

/**
 * contextual typing to type guards is annoying (often have to restate the signature),
 * so this helper will remove the type assertions from the interface you are currently defining.
 * @experimental
 */
export type StripGuards<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => R
    : StripGuards<T[K]>;
};

/**
 * Defines an extension to the Typekit interface.
 *
 * All Typekit instances will inherit the functionality defined by calls to this function.
 *
 * @experimental
 */
export function defineKit<T extends Record<string, any>>(
  source: StripGuards<T> & ThisType<Typekit>,
): void {
  for (const [name, fnOrNs] of Object.entries(source)) {
    TypekitPrototype[name] = fnOrNs;
  }
}
