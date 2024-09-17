import type { Program } from "../core/program.js";
import type { Type } from "../core/types.js";

function createStateSymbol(name: string) {
  return Symbol.for(`TypeSpec.${name}`);
}

type StateMapGetter<K extends Type, V> = (program: Program, type: K) => V | undefined;
type StateMapSetter<K extends Type, V> = (program: Program, type: K, value: V) => void;
type StateMapMapGetter<K extends Type, V> = (program: Program) => Map<K, V>;

export function useStateMap<K extends Type, V>(
  key: string,
): [StateMapGetter<K, V>, StateMapSetter<K, V>, StateMapMapGetter<K, V>] {
  const stateKey = createStateSymbol(key);
  const getter = (program: Program, target: K) => program.stateMap(stateKey).get(target);
  const setter = (program: Program, target: K, value: V) =>
    program.stateMap(stateKey).set(target, value);
  const mapGetter = (program: Program) => program.stateMap(stateKey);
  return [getter, setter, mapGetter as any];
}

type StateSetGetter<K extends Type> = (program: Program, type: K) => boolean;
type StateSetSetter<K extends Type> = (program: Program, type: K) => void;
export function useStateSet<K extends Type>(key: string): [StateSetGetter<K>, StateSetSetter<K>] {
  const stateKey = createStateSymbol(key);
  const getter = (program: Program, target: K) => program.stateSet(stateKey).has(target);
  const setter = (program: Program, target: K) => program.stateSet(stateKey).add(target);

  return [getter, setter];
}
