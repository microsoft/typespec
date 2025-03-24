import type { Type } from "./types.js";

export class StateMap extends Map<undefined, Map<Type, unknown>> {}
export class StateSet extends Map<undefined, Set<Type>> {}

class StateMapView<V> implements Map<Type, V> {
  public constructor(private map: Map<Type, V>) {}

  /** Check if the given type has state */
  has(t: Type) {
    return this.map.has(t) ?? false;
  }

  set(t: Type, v: any) {
    this.map.set(t, v);
    return this;
  }

  get(t: Type) {
    return this.map.get(t);
  }

  delete(t: Type) {
    return this.map.delete(t);
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  forEach(cb: (value: V, key: Type, map: Map<Type, V>) => void, thisArg?: any) {
    this.map.forEach(cb, thisArg);
    return this;
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  get size() {
    return this.map.size;
  }

  clear() {
    return this.map.clear();
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  entries() {
    return this.map.entries();
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  values() {
    return this.map.values();
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  keys() {
    return this.map.keys();
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  [Symbol.iterator]() {
    return this.entries();
  }

  [Symbol.toStringTag] = "StateMap";
}

class StateSetView implements Set<Type> {
  public constructor(private set: Set<Type>) {}

  has(t: Type) {
    return this.set.has(t) ?? false;
  }

  add(t: Type) {
    this.set.add(t);
    return this;
  }

  delete(t: Type) {
    return this.set.delete(t);
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  forEach(cb: (value: Type, value2: Type, set: Set<Type>) => void, thisArg?: any) {
    this.set.forEach(cb, thisArg);
    return this;
  }

  get size() {
    return this.set.size;
  }

  clear() {
    return this.set.clear();
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  values() {
    return this.set.values();
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  keys() {
    return this.set.keys();
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  entries() {
    return this.set.entries();
  }

  /**
   * Danger: Iterating over all types in the state map is not recommended.
   * This occur unexpected result when types are dynamically created, cloned, or removed.
   */
  [Symbol.iterator]() {
    return this.values();
  }

  [Symbol.toStringTag] = "StateSet";
}

export function createStateAccessors(
  stateMaps: Map<symbol, Map<Type, unknown>>,
  stateSets: Map<symbol, Set<Type>>,
) {
  function stateMap<T>(key: symbol): StateMapView<T> {
    let m = stateMaps.get(key);

    if (!m) {
      m = new Map<Type, T>();
      stateMaps.set(key, m);
    }

    return new StateMapView<T>(m as any);
  }

  function stateSet(key: symbol): StateSetView {
    let s = stateSets.get(key);

    if (!s) {
      s = new Set();
      stateSets.set(key, s);
    }

    return new StateSetView(s);
  }

  return { stateMap, stateSet };
}
