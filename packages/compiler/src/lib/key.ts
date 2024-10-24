import { Program } from "../core/index.js";
import { ModelProperty, Type } from "../core/types.js";
import { useStateMap } from "./utils.js";

const [getKey, setKey] = useStateMap<Type, string>("key");

export function isKey(program: Program, property: ModelProperty) {
  return getKey(program, property) !== undefined;
}

export { getKey as getKeyName, setKey };
