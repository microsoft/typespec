import type { Type } from "@typespec/compiler";
import { unsafe_useStateMap, unsafe_useStateSet } from "@typespec/compiler/experimental";

/**
 * This is a copy of the experimental state-accessor lib from @typespec/compiler
 */

function createStateSymbol(name: string) {
  return Symbol.for(`TypeSpec.${name}`);
}

export function useStateMap<K extends Type, V>(key: string | symbol) {
  return unsafe_useStateMap<K, V>(typeof key === "string" ? createStateSymbol(key) : key);
}

export function useStateSet<K extends Type>(key: string | symbol) {
  return unsafe_useStateSet<K>(typeof key === "string" ? createStateSymbol(key) : key);
}
