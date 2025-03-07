import type { Type } from "./types.js";

export class StateMap extends Map<undefined, Map<Type, unknown>> {}
export class StateSet extends Map<undefined, Set<Type>> {}

// TODO: need to remove the dispatch logic not needed anymore
class StateMapView<V> implements Map<Type, V> {
  public constructor(private state: StateMap) {}

  has(t: Type) {
    return this.dispatch()?.has(t) ?? false;
  }

  set(t: Type, v: any) {
    this.dispatch().set(t, v);
    return this;
  }

  get(t: Type) {
    return this.dispatch().get(t);
  }

  delete(t: Type) {
    return this.dispatch().delete(t);
  }

  forEach(cb: (value: V, key: Type, map: Map<Type, V>) => void, thisArg?: any) {
    this.dispatch().forEach(cb, thisArg);
    return this;
  }

  get size() {
    return this.dispatch().size;
  }

  clear() {
    return this.dispatch().clear();
  }

  entries() {
    return this.dispatch().entries();
  }

  values() {
    return this.dispatch().values();
  }

  keys() {
    return this.dispatch().keys();
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  [Symbol.toStringTag] = "StateMap";

  dispatch(): Map<Type, V> {
    if (!this.state.has(undefined)) {
      this.state.set(undefined, new Map());
    }

    return this.state.get(undefined)! as any;
  }
}

class StateSetView implements Set<Type> {
  public constructor(private state: StateSet) {}

  has(t: Type) {
    return this.dispatch()?.has(t) ?? false;
  }

  add(t: Type) {
    this.dispatch().add(t);
    return this;
  }

  delete(t: Type) {
    return this.dispatch().delete(t);
  }

  forEach(cb: (value: Type, value2: Type, set: Set<Type>) => void, thisArg?: any) {
    this.dispatch().forEach(cb, thisArg);
    return this;
  }

  get size() {
    return this.dispatch().size;
  }

  clear() {
    return this.dispatch().clear();
  }

  values() {
    return this.dispatch().values();
  }

  keys() {
    return this.dispatch().keys();
  }

  entries() {
    return this.dispatch().entries();
  }

  [Symbol.iterator]() {
    return this.values();
  }

  [Symbol.toStringTag] = "StateSet";

  dispatch(): Set<Type> {
    if (!this.state.has(undefined)) {
      this.state.set(undefined, new Set());
    }

    return this.state.get(undefined)!;
  }
}

export function createStateAccessors(
  stateMaps: Map<symbol, StateMap>,
  stateSets: Map<symbol, StateSet>,
) {
  function stateMap<T>(key: symbol): StateMapView<T> {
    let m = stateMaps.get(key);

    if (!m) {
      m = new StateMap();
      stateMaps.set(key, m);
    }

    return new StateMapView(m);
  }

  function stateSet(key: symbol): StateSetView {
    let s = stateSets.get(key);

    if (!s) {
      s = new StateSet();
      stateSets.set(key, s);
    }

    return new StateSetView(s);
  }

  return { stateMap, stateSet };
}
