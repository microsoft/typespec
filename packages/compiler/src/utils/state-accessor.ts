import type { Program } from "../core/program.js";
import type { Type } from "../core/types.js";

/** Read a type's program-local state value, returning undefined when no entry exists. */
type StateMapGetter<K extends Type, V> = (program: Program, type: K) => V | undefined;
/** Associate a state value with a type in the supplied program, replacing any previous entry. */
type StateMapSetter<K extends Type, V> = (program: Program, type: K, value: V) => void;
/** Obtain the live mutable state map, not a copy, for the supplied program. */
type StateMapMapGetter<K extends Type, V> = (program: Program) => Map<K, V>;

/**
 * Bind a symbol to typed getter, setter, and live-map accessor functions, in that order.
 * Data belongs to the program passed on each call; creating these accessors does not allocate a shared map.
 */
export function useStateMap<K extends Type, V>(
  key: symbol,
): [StateMapGetter<K, V>, StateMapSetter<K, V>, StateMapMapGetter<K, V>] {
  const getter = (program: Program, target: K) => program.stateMap(key).get(target);
  const setter = (program: Program, target: K, value: V) =>
    program.stateMap(key).set(target, value);
  const mapGetter = (program: Program) => program.stateMap(key);
  return [getter, setter, mapGetter as any];
}

/** Test a type's membership in the state set belonging to the supplied program. */
type StateSetGetter<K extends Type> = (program: Program, type: K) => boolean;
/** Add a type to the supplied program's state set; adding it again leaves membership unchanged. */
type StateSetSetter<K extends Type> = (program: Program, type: K) => void;

/** Bind a symbol to membership-test and add functions for a program-local set, in that order. */
export function useStateSet<K extends Type>(key: symbol): [StateSetGetter<K>, StateSetSetter<K>] {
  const getter = (program: Program, target: K) => program.stateSet(key).has(target);
  const setter = (program: Program, target: K) => program.stateSet(key).add(target);

  return [getter, setter];
}
