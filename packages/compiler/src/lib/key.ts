import { Program } from "../core/program.js";
import { ModelProperty, Type } from "../core/types.js";
import { useStateMap } from "../utils/index.js";
import { createStateSymbol } from "./utils.js";

const [getKey, setKey] = useStateMap<Type, string>(createStateSymbol("key"));

export function isKey(program: Program, property: ModelProperty) {
  return getKey(program, property) !== undefined;
}

export { getKey as getKeyName, setKey };
