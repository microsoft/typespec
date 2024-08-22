import { compilerAssert } from "./diagnostics.js";
import { Program } from "./program.js";
import { createTypeFactory } from "./type-factory.js";
import { Type } from "./types.js";

class StateMapRealmView<V> implements Map<Type, V> {
  #realm: Realm;
  #parentState: Map<Type, V>;
  #realmState: Map<Type, V>;

  public constructor(realm: Realm, realmState: Map<Type, V>, parentState: Map<Type, V>) {
    this.#realm = realm;
    this.#parentState = parentState;
    this.#realmState = realmState;
  }

  has(t: Type) {
    return this.dispatch(t).has(t) ?? false;
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
    for (const item of this.entries()) {
      cb.call(thisArg, item[1], item[0], this);
    }

    return this;
  }

  get size() {
    // extremely non-optimal, maybe worth not offering it?
    return [...this.entries()].length;
  }

  clear() {
    this.#realmState.clear();
  }

  *entries() {
    for (const item of this.#realmState) {
      yield item;
    }

    for (const item of this.#parentState) {
      yield item;
    }
  }

  *values() {
    for (const item of this.entries()) {
      yield item[1];
    }
  }

  *keys() {
    for (const item of this.entries()) {
      yield item[0];
    }
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  [Symbol.toStringTag] = "StateMap";

  dispatch(keyType: Type): Map<Type, V> {
    if (this.#realm.hasType(keyType)) {
      return this.#realmState;
    }

    return this.#parentState;
  }
}

export class Realm {
  #program!: Program;

  // Type registry

  /**
   * Stores all types owned by this realm.
   */
  #types = new Set<Type>();

  /**
   * Stores types that are deleted in this realm. When a realm is active and doing a traversal, you will
   * not find this type in e.g. collections. Deleted types are mapped to `null` if you ask for it.
   */
  #deletedTypes = new Set<Type>();

  /**
   * Stores types that are not present in the parent realm.
   */
  #createdTypes = new Set<Type>();

  #stateMaps = new Map<symbol, Map<Type, any>>();
  public key!: symbol;
  public typeFactory: ReturnType<typeof createTypeFactory>;

  constructor(program: Program, description: string) {
    this.key = Symbol(description);
    this.#program = program;
    Realm.#knownRealms.set(this.key, this);
    this.typeFactory = createTypeFactory(program, this);
  }

  stateMap(stateKey: symbol) {
    let m = this.#stateMaps.get(stateKey);

    if (!m) {
      m = new Map();
      this.#stateMaps.set(stateKey, m);
    }

    return new StateMapRealmView<any>(this, m, this.#program.stateMap(stateKey));
  }

  clone<T extends Type>(type: T): T {
    compilerAssert(type, "Undefined type passed to clone");

    const clone = this.#cloneIntoRealm(type);
    this.typeFactory.finishType(clone);

    return clone;
  }

  remove(type: Type): void {
    this.#deletedTypes.add(type);
  }

  hasType(type: Type): boolean {
    return this.#types.has(type);
  }

  addType(type: Type): void {
    this.#types.add(type);
    Realm.realmForType.set(type, this);
  }

  #cloneIntoRealm<T extends Type>(type: T): T {
    const clone = this.typeFactory.initializeClone(type);
    this.#types.add(clone);
    Realm.realmForType.set(clone, this);
    return clone;
  }

  static #knownRealms = new Map<symbol, Realm>();

  static realmForKey(key: symbol, parentRealm?: Realm) {
    return this.#knownRealms.get(key);
  }

  static realmForType = new Map<Type, Realm>();
}
