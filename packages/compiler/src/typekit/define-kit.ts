import { type Program } from "../core/program.js";
import { Realm } from "../experimental/realm.js";

/**
 * A Typekit is a collection of utility functions and namespaces that allow you to work with TypeSpec types.
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
 * @internal
 */
export const TypekitPrototype: Record<string, unknown> = {};

/**
 * contextual typing to type guards is annoying (often have to restate the signature),
 * so this helper will remove the type assertions from the interface you are currently defining.
 */
export type StripGuards<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => R
    : T[K] extends Record<string, any>
      ? StripGuards<T[K]>
      : T[K];
};

export const TypekitNamespaceSymbol = Symbol.for("TypekitNamespace");

/**
 * Defines an extension to the Typekit interface.
 *
 * All Typekit instances will inherit the functionality defined by calls to this function.
 */
export function defineKit<T extends Record<string, any>>(
  source: StripGuards<T> & ThisType<Typekit>,
): void {
  for (const [name, fnOrNs] of Object.entries(source)) {
    let kits = fnOrNs;

    if (TypekitPrototype[name] !== undefined) {
      kits = { ...TypekitPrototype[name], ...fnOrNs };
    }

    // Tag top-level namespace objects with the symbol
    if (typeof kits === "object" && kits !== null) {
      Object.defineProperty(kits, TypekitNamespaceSymbol, {
        value: true,
        enumerable: false, // Keep the symbol non-enumerable
        configurable: false,
      });
    }

    TypekitPrototype[name] = kits;
  }
}
