import type { Program } from "../core/program.js";
import type { Type } from "../core/types.js";

type StateMapGetter<K extends Type, V> = (program: Program, type: K) => V | undefined;
type StateMapSetter<K extends Type, V> = (program: Program, type: K, value: V) => void;
type StateMapMapGetter<K extends Type, V> = (program: Program) => Map<K, V>;

/** @experimental */
export function unsafe_useStateMap<K extends Type, V>(
  key: symbol,
): [StateMapGetter<K, V>, StateMapSetter<K, V>, StateMapMapGetter<K, V>] {
  const getter = (program: Program, target: K) => program.stateMap(key).get(target);
  const setter = (program: Program, target: K, value: V) =>
    program.stateMap(key).set(target, value);
  const mapGetter = (program: Program) => program.stateMap(key);
  return [getter, setter, mapGetter as any];
}

type StateSetGetter<K extends Type> = (program: Program, type: K) => boolean;
type StateSetSetter<K extends Type> = (program: Program, type: K) => void;

/** @experimental */
export function unsafe_useStateSet<K extends Type>(
  key: symbol,
): [StateSetGetter<K>, StateSetSetter<K>] {
  const getter = (program: Program, target: K) => program.stateSet(key).has(target);
  const setter = (program: Program, target: K) => program.stateSet(key).add(target);

  return [getter, setter];
}
