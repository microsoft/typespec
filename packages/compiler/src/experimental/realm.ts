import { compilerAssert } from "../core/diagnostics.js";
import { Program } from "../core/program.js";
import { Namespace, Type } from "../core/types.js";
import type { Typekit } from "../typekit/index.js";
import { createTypekit } from "./typekit/index.js";

/**
 * Symbol used to attach a back-link from a cloned type to its original.
 *
 * This is used by {@link StateMapRealmView} so that state-map reads on a clone
 * fall back to the original's state in the parent program when the realm has
 * not set its own value for the clone.
 *
 * @experimental
 */
const ORIGINAL_TYPE = Symbol.for("TypeSpec.Realm.originalType");

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
    if (this.#select(t).has(t)) return true;
    // Fall back to the original type's state in the parent program. This lets
    // state set on the original type (e.g. by decorators on the source program)
    // remain visible when callers ask about the clone.
    const original = (t as any)[ORIGINAL_TYPE] as Type | undefined;
    if (original && this.#realm.hasType(t) && !this.#realmState.has(t)) {
      return this.#parentState.has(original);
    }
    return false;
  }

  set(t: Type, v: any) {
    this.#select(t).set(t, v);
    return this;
  }

  get(t: Type) {
    const target = this.#select(t);
    if (target.has(t)) return target.get(t);
    // Fall back to the original type's state in the parent program.
    const original = (t as any)[ORIGINAL_TYPE] as Type | undefined;
    if (original && this.#realm.hasType(t)) {
      return this.#parentState.get(original);
    }
    return undefined;
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

  *entries(): MapIterator<[Type, V]> {
    for (const item of this.#realmState) {
      yield item;
    }

    for (const item of this.#parentState) {
      yield item;
    }

    return undefined;
  }

  *values(): MapIterator<V> {
    for (const item of this.entries()) {
      yield item[1];
    }

    return undefined;
  }

  *keys(): MapIterator<Type> {
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
 * A Realm's view of a Program's state set for a given state key.
 *
 * Mirrors {@link StateMapRealmView} for Set-shaped state. Membership writes go
 * to whichever side owns the type (realm vs parent). Reads on a clone fall back
 * to the original type's membership in the parent set.
 *
 * @experimental
 */
class StateSetRealmView implements Set<Type> {
  #realm: Realm;
  #parentState: Set<Type>;
  #realmState: Set<Type>;

  public constructor(realm: Realm, realmState: Set<Type>, parentState: Set<Type>) {
    this.#realm = realm;
    this.#parentState = parentState;
    this.#realmState = realmState;
  }

  add(t: Type): this {
    this.#select(t).add(t);
    return this;
  }

  has(t: Type): boolean {
    if (this.#select(t).has(t)) return true;
    const original = (t as any)[ORIGINAL_TYPE] as Type | undefined;
    if (original && this.#realm.hasType(t) && !this.#realmState.has(t)) {
      return this.#parentState.has(original);
    }
    return false;
  }

  delete(t: Type): boolean {
    return this.#select(t).delete(t);
  }

  clear(): void {
    this.#realmState.clear();
  }

  get size(): number {
    return this.#realmState.size + this.#parentState.size;
  }

  forEach(cb: (value: Type, value2: Type, set: Set<Type>) => void, thisArg?: any): void {
    for (const item of this.values()) {
      cb.call(thisArg, item, item, this);
    }
  }

  *values(): SetIterator<Type> {
    for (const item of this.#realmState) yield item;
    for (const item of this.#parentState) yield item;
  }

  *keys(): SetIterator<Type> {
    yield* this.values();
  }

  *entries(): SetIterator<[Type, Type]> {
    for (const item of this.values()) yield [item, item];
  }

  [Symbol.iterator](): SetIterator<Type> {
    return this.values();
  }

  [Symbol.toStringTag] = "StateSet";

  #select(keyType: Type): Set<Type> {
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
  #stateSets = new Map<symbol, Set<Type>>();

  /**
   * The cloned global namespace for this realm, if the realm was produced by a
   * namespace-rooted mutation. This is set by the mutator engine when it clones
   * the global namespace and is exposed via {@link asProgram} so downstream
   * stages can traverse the mutated type graph.
   */
  #globalNamespace: Namespace | undefined;

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

  /**
   * Gets a state set for the given state key symbol.
   *
   * Mirrors {@link Realm.stateMap} but for state sets. Returns a view layered
   * over the parent program's state set: membership writes go to the realm,
   * reads fall through to the parent for non-realm types.
   *
   * @param stateKey - The symbol to use as the state key.
   * @returns The realm's state set for the given state key.
   *
   * @experimental
   */
  stateSet(stateKey: symbol): Set<Type> {
    let s = this.#stateSets.get(stateKey);
    if (!s) {
      s = new Set();
      this.#stateSets.set(stateKey, s);
    }
    return new StateSetRealmView(this, s, this.#program.stateSet(stateKey));
  }

  /**
   * The cloned global namespace for this realm.
   *
   * Set by the mutator engine when a namespace-rooted mutation runs and the
   * global namespace is cloned. Undefined when the mutation did not touch the
   * global namespace.
   *
   * @experimental
   */
  get globalNamespace(): Namespace | undefined {
    return this.#globalNamespace;
  }

  /**
   * Records the cloned global namespace for this realm.
   *
   * Intended to be called by the mutator engine, not by user code.
   *
   * @internal
   */
  setGlobalNamespace(ns: Namespace): void {
    this.#globalNamespace = ns;
  }

  /**
   * Returns a {@link Program}-shaped view of this realm.
   *
   * The returned program delegates everything that has not changed
   * (compiler options, host, source files, checker, resolver, project root, ...)
   * to the parent program, and overrides the things the realm owns:
   *
   * - {@link Program.getGlobalNamespaceType} returns the cloned global namespace
   *   if one was recorded, otherwise the parent's global namespace.
   * - {@link Program.stateMap} and {@link Program.stateSet} return realm-layered
   *   views (writes are realm-local; reads fall back to the parent and to
   *   original types via the clone back-link).
   *
   * This makes a mutated realm consumable as input to a subsequent mutation
   * stage or to an emitter that takes a `Program`.
   *
   * @experimental
   */
  asProgram(): Program {
    const realm = this;
    const parent = this.#program;
    const globalNs = this.#globalNamespace;

    // Layered state map / set caches so repeated calls return the same view.
    const layeredMaps = new Map<symbol, Map<Type, any>>();
    const layeredSets = new Map<symbol, Set<Type>>();
    const stateMap = (key: symbol): Map<Type, any> => {
      let m = layeredMaps.get(key);
      if (!m) {
        m = realm.stateMap(key);
        layeredMaps.set(key, m);
      }
      return m;
    };
    const stateSet = (key: symbol): Set<Type> => {
      let s = layeredSets.get(key);
      if (!s) {
        s = realm.stateSet(key);
        layeredSets.set(key, s);
      }
      return s;
    };

    const facade: Program = {
      // Pure pass-through to the parent program.
      get compilerOptions() {
        return parent.compilerOptions;
      },
      get mainFile() {
        return parent.mainFile;
      },
      get sourceFiles() {
        return parent.sourceFiles;
      },
      get jsSourceFiles() {
        return parent.jsSourceFiles;
      },
      get literalTypes() {
        return parent.literalTypes;
      },
      get host() {
        return parent.host;
      },
      get tracer() {
        return parent.tracer;
      },
      trace: (area, message) => parent.trace(area, message),
      get checker() {
        return parent.checker;
      },
      get resolver() {
        return parent.resolver;
      },
      get emitters() {
        return parent.emitters;
      },
      get diagnostics() {
        return parent.diagnostics;
      },
      loadTypeSpecScript: (sf) => parent.loadTypeSpecScript(sf),
      onValidate: (cb, lib) => parent.onValidate(cb, lib),
      getOption: (key) => parent.getOption(key),
      get stats() {
        return parent.stats;
      },
      hasError: () => parent.hasError(),
      reportDiagnostic: (d) => parent.reportDiagnostic(d),
      reportDiagnostics: (ds) => parent.reportDiagnostics(ds),
      reportDuplicateSymbols: (s) => parent.reportDuplicateSymbols(s),
      resolveTypeReference: (ref) => parent.resolveTypeReference(ref),
      resolveTypeOrValueReference: (ref) => parent.resolveTypeOrValueReference(ref),
      getSourceFileLocationContext: (sf) => parent.getSourceFileLocationContext(sf),
      get projectRoot() {
        return parent.projectRoot;
      },

      // Realm-aware overrides.
      getGlobalNamespaceType: () => globalNs ?? parent.getGlobalNamespaceType(),
      stateMap,
      stateSet,
      // The aggregate state-map and state-set collections are exposed as
      // proxies that resolve each lookup through the layered view. Most callers
      // iterate over a specific key (via stateMap(key)/stateSet(key)) so this
      // is mainly here to satisfy the Program shape.
      get stateMaps() {
        return new Proxy(parent.stateMaps, {
          get: (target, prop) => {
            if (prop === "get") {
              return (key: symbol) => stateMap(key);
            }
            return Reflect.get(target, prop);
          },
        }) as Map<symbol, Map<Type, unknown>>;
      },
      get stateSets() {
        return new Proxy(parent.stateSets, {
          get: (target, prop) => {
            if (prop === "get") {
              return (key: symbol) => stateSet(key);
            }
            return Reflect.get(target, prop);
          },
        }) as Map<symbol, Set<Type>>;
      },
    };

    return facade;
  }

  #cloneIntoRealm<T extends Type>(type: T): T {
    const clone = this.typekit.type.clone(type);
    this.#types.add(clone);
    Realm.realmForType.set(clone, this);
    // Record a back-link so state-map reads against the clone can fall back to
    // state set on the original type in the parent program. This is what
    // preserves decorator state (e.g. @doc, @visibility) across the realm
    // boundary without the engine having to eagerly copy every state map.
    Object.defineProperty(clone, ORIGINAL_TYPE, {
      value: type,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return clone;
  }

  // TODO better way?
  /** @internal */
  public get types() {
    return this.#types;
  }

  static realmForType = singleton("Realm.realmForType", () => new WeakMap<Type, Realm>());
}

/**
 * Create a singleton instance that is shared across the process.
 * This is to have a true singleton even if multiple instance of the compiler/library are loaded.
 * @param key - The key to use for the singleton.
 * @param init - The function to call to create the singleton.
 */
function singleton<T>(key: string, init: () => T): T {
  const sym = Symbol.for(key);
  if (!(globalThis as any)[sym]) {
    (globalThis as any)[sym] = init();
  }

  return (globalThis as any)[sym];
}
