import { compilerAssert } from "../core/diagnostics.js";
import { Program } from "../core/program.js";
import { Type } from "../core/types.js";
import { createTypekit, Typekit } from "./typekit/index.js";

/**
 * A Realm's view of a Program's state map for a given state key.
 *
 * For all operations, if a type was created within the realm, the realm's own state map is used. Otherwise, the owning'
 * Program's state map is used.
 *
 * @experimental
 */
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
    return this.#select(t).has(t) ?? false;
  }

  set(t: Type, v: any) {
    this.#select(t).set(t, v);
    return this;
  }

  get(t: Type) {
    return this.#select(t).get(t);
  }

  delete(t: Type) {
    return this.#select(t).delete(t);
  }

  forEach(cb: (value: V, key: Type, map: Map<Type, V>) => void, thisArg?: any) {
    for (const item of this.entries()) {
      cb.call(thisArg, item[1], item[0], this);
    }

    return this;
  }

  get size() {
    return this.#realmState.size + this.#parentState.size;
  }

  clear() {
    this.#realmState.clear();
  }

  *entries(): IterableIterator<[Type, V]> {
    for (const item of this.#realmState) {
      yield item;
    }

    for (const item of this.#parentState) {
      yield item;
    }

    return undefined;
  }

  *values(): IterableIterator<V> {
    for (const item of this.entries()) {
      yield item[1];
    }

    return undefined;
  }

  *keys(): IterableIterator<Type> {
    for (const item of this.entries()) {
      yield item[0];
    }

    return undefined;
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  [Symbol.toStringTag] = "StateMap";

  #select(keyType: Type): Map<Type, V> {
    if (this.#realm.hasType(keyType)) {
      return this.#realmState;
    }

    return this.#parentState;
  }
}

/**
 * A Realm is an alternate view of a Program where types can be cloned, deleted, and modified without affecting the
 * original types in the Program.
 *
 * The realm stores the types that exist within the realm, views of state maps that only apply within the realm,
 * and a view of types that have been removed from the realm's view.
 *
 * @experimental
 */
export class Realm {
  #program: Program;

  /**
   * Stores all types owned by this realm.
   */
  #types = new Set<Type>();

  /**
   * Stores types that are deleted in this realm. When a realm is active and doing a traversal, you will
   * not find this type in e.g. collections. Deleted types are mapped to `null` if you ask for it.
   */
  #deletedTypes = new WeakSet<Type>();

  #stateMaps = new Map<symbol, Map<Type, any>>();
  public key!: symbol;

  /**
   * Create a new realm in the given program.
   *
   * @param program - The program to create the realm in.
   * @param description - A short description of the realm's purpose.
   */
  constructor(program: Program, description: string) {
    this.key = Symbol(description);
    this.#program = program;

    Realm.#knownRealms.set(this.key, this);
  }

  #_typekit: Typekit | undefined;

  /**
   * The typekit instance bound to this realm.
   *
   * If the realm does not already have a typekit associated with it, one will be created and bound to this realm.
   */
  get typekit(): Typekit {
    return (this.#_typekit ??= createTypekit(this));
  }

  /**
   * The program that this realm is associated with.
   */
  get program(): Program {
    return this.#program;
  }

  /**
   * Gets a state map for the given state key symbol.
   *
   * This state map is a view of the program's state map for the given state key, with modifications made to the realm's
   * own state.
   *
   * @param stateKey - The symbol to use as the state key.
   * @returns The realm's state map for the given state key.
   */
  stateMap(stateKey: symbol) {
    let m = this.#stateMaps.get(stateKey);

    if (!m) {
      m = new Map();
      this.#stateMaps.set(stateKey, m);
    }

    return new StateMapRealmView<any>(this, m, this.#program.stateMap(stateKey));
  }

  /**
   * Clones a type and adds it to the realm. This operation will use the realm's typekit to clone the type.
   *
   * @param type - The type to clone.
   * @returns A clone of the input type that exists within this realm.
   */
  clone<T extends Type>(type: T): T {
    compilerAssert(type, "Undefined type passed to clone");

    const clone = this.#cloneIntoRealm(type);
    this.typekit.type.finishType(clone);

    return clone;
  }

  /**
   * Removes a type from this realm. This operation will not affect the type in the program, only this realm's view
   * of the type.
   *
   * @param type - The TypeSpec type to remove from this realm.
   */
  remove(type: Type): void {
    this.#deletedTypes.add(type);
  }

  /**
   * Determines whether or not this realm contains a given type.
   *
   * @param type - The type to check.
   * @returns true if the type was created within this realm or added to this realm, false otherwise.
   */
  hasType(type: Type): boolean {
    return this.#types.has(type);
  }

  /**
   * Adds a type to this realm. Once a type is added to the realm, the realm considers it part of itself.
   *
   * A type can be present in multiple realms, but `Realm.realmForType` will only return the last realm that the type
   * was added to.
   *
   * @param type - The type to add to this realm.
   */
  addType(type: Type): void {
    this.#types.add(type);
    Realm.realmForType.set(type, this);
  }

  #cloneIntoRealm<T extends Type>(type: T): T {
    const clone = this.typekit.type.clone(type);
    this.#types.add(clone);
    Realm.realmForType.set(clone, this);
    return clone;
  }

  static #knownRealms = new Map<symbol, Realm>();

  static realmForKey(key: symbol, parentRealm?: Realm) {
    return this.#knownRealms.get(key);
  }

  static realmForType = new WeakMap<Type, Realm>();
}
