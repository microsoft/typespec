import type { Type } from "@typespec/compiler";
import { unsafe_useStateMap, unsafe_useStateSet } from "@typespec/compiler/experimental";

export function useStateMap<K extends Type, V>(key: symbol) {
  return unsafe_useStateMap<K, V>(key);
}

export function useStateSet<K extends Type>(key: symbol) {
  return unsafe_useStateSet<K>(key);
}
