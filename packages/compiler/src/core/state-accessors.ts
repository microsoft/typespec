import type { Projector, Type } from "./types.js";

export class StateMap extends Map<undefined | Projector, Map<Type, unknown>> {}
export class StateSet extends Map<undefined | Projector, Set<Type>> {}

class StateMapView<V> implements Map<Type, V> {
  public constructor(
    private state: StateMap,
    private projector?: Projector,
  ) {}

  has(t: Type) {
    return this.dispatch(t)?.has(t) ?? false;
  }

  set(t: Type, v: any) {
    this.dispatch(t).set(t, v);
    return this;
  }

  get(t: Type) {
    return this.dispatch(t).get(t);
  }

  delete(t: Type) {
    return this.dispatch(t).delete(t);
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

  dispatch(keyType?: Type): Map<Type, V> {
    const key = keyType ? keyType.projector : this.projector;
    if (!this.state.has(key)) {
      this.state.set(key, new Map());
    }

    return this.state.get(key)! as any;
  }
}

class StateSetView implements Set<Type> {
  public constructor(
    private state: StateSet,
    private projector?: Projector,
  ) {}

  has(t: Type) {
    return this.dispatch(t)?.has(t) ?? false;
  }

  add(t: Type) {
    this.dispatch(t).add(t);
    return this;
  }

  delete(t: Type) {
    return this.dispatch(t).delete(t);
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

  dispatch(keyType?: Type): Set<Type> {
    const key = keyType ? keyType.projector : this.projector;
    if (!this.state.has(key)) {
      this.state.set(key, new Set());
    }

    return this.state.get(key)!;
  }
}

export function createStateAccessors(
  stateMaps: Map<symbol, StateMap>,
  stateSets: Map<symbol, StateSet>,
  projector?: Projector,
) {
  function stateMap<T>(key: symbol): StateMapView<T> {
    let m = stateMaps.get(key);

    if (!m) {
      m = new StateMap();
      stateMaps.set(key, m);
    }

    return new StateMapView(m, projector);
  }

  function stateSet(key: symbol): StateSetView {
    let s = stateSets.get(key);

    if (!s) {
      s = new StateSet();
      stateSets.set(key, s);
    }

    return new StateSetView(s, projector);
  }

  return { stateMap, stateSet };
}
