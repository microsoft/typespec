import { Program } from "../core/index.js";
import { ModelProperty, Type } from "../core/types.js";
import { useStateMap } from "../utils/index.js";

function createStateSymbol(name: string) {
  return Symbol.for(`TypeSpec.${name}`);
}

const [getKey, setKey] = useStateMap<Type, string>(createStateSymbol("key"));

export function isKey(program: Program, property: ModelProperty) {
  return getKey(program, property) !== undefined;
}

export { getKey as getKeyName, setKey };
