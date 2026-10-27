import type { Program } from "../core/program.js";
import type { ModelProperty, Type } from "../core/types.js";
import { useStateMap } from "../utils/index.js";
import { createStateSymbol } from "./utils.js";

/** Gets the registered key name, which defaults to the property's name with `@key`, or `undefined` for a non-key. */
const [getKey, setKey] = useStateMap<Type, string>(createStateSymbol("key"));

/** Tests whether this property has a key name registered by `@key` or the compiler's key state. */
export function isKey(program: Program, property: ModelProperty) {
  return getKey(program, property) !== undefined;
}

export { getKey as getKeyName, setKey };
