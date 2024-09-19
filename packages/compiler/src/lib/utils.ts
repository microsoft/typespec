import type { Type } from "../core/types.js";
import { unsafe_useStateMap, unsafe_useStateSet } from "../experimental/state-accessor.js";

function createStateSymbol(name: string) {
  return Symbol.for(`TypeSpec.${name}`);
}

export function useStateMap<K extends Type, V>(key: string | symbol) {
  return unsafe_useStateMap<K, V>(typeof key === "string" ? createStateSymbol(key) : key);
}

export function useStateSet<K extends Type>(key: string | symbol) {
  return unsafe_useStateSet<K>(typeof key === "string" ? createStateSymbol(key) : key);
}
