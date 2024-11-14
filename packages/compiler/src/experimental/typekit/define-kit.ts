import { type Program } from "../../core/program.js";
import { Realm } from "../realm.js";

/** @experimental */
export interface Typekit {
  readonly program: Program;
  readonly realm: Realm;
}

/** @experimental */
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

/** @experimental */
export function defineKit<T extends Record<string, any>>(
  source: StripGuards<T> & ThisType<Typekit>,
): void {
  for (const [name, fnOrNs] of Object.entries(source)) {
    TypekitPrototype[name] = fnOrNs;
  }
}
