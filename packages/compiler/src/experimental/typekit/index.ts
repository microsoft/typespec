import { compilerAssert, Program } from "../../core/index.js";
import { Realm, REALM_TYPEKIT } from "../realm.js";
import { Typekit, TypekitPrototype } from "./define-kit.js";

export * from "./define-kit.js";
export * from "./kits/index.js";

/** @experimental */
export function createTypekit(realm: Realm): Typekit {
  const tk = Object.create(TypekitPrototype);

  const handler: ProxyHandler<Typekit> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "program") {
        // don't wrap program (probably need to ensure this isn't a nested program somewhere)
        return realm.program;
      }

      if (prop === "realm") {
        return realm;
      }

      if (typeof value === "function") {
        return function (this: any, ...args: any[]) {
          return value.apply(proxy, args);
        };
      }

      if (typeof value === "object" && value !== null) {
        return new Proxy(value, handler);
      }

      return value;
    },
  };

  const proxy = new Proxy(tk, handler);
  return proxy;
}

/** @experimental */
export function $old(realm: Realm): Typekit {
  return realm[REALM_TYPEKIT];
}

const CURRENT_PROGRAM = Symbol.for("TypeSpec::Typekit::CURRENT_PROGRAM");
const DEFAULT_REALM = Symbol.for("TypeSpec::Typekit::DEFAULT_TYPEKIT_REALM");

function getCurrentProgram(): Program | undefined {
  return (globalThis as any)[CURRENT_PROGRAM];
}

export function setCurrentProgram(program: Program) {
  (globalThis as any)[CURRENT_PROGRAM] = program;
}

interface DefaultRealmStore {
  [DEFAULT_REALM]?: Realm;
}

interface DefaultTypekit extends Typekit {
  (realm: Realm): Typekit;
}

export const $: DefaultTypekit = new Proxy((realm: Realm) => realm[REALM_TYPEKIT], {
  get(_target, prop, receiver) {
    const currentProgram = getCurrentProgram();

    compilerAssert(
      currentProgram !== undefined,
      "Default typekits may not be used until a program is set in the compiler.",
    );

    if (prop === "program") return currentProgram;

    const realm = ((currentProgram as DefaultRealmStore)[DEFAULT_REALM] ??= new Realm(
      currentProgram,
      "default typekit realm",
    ));

    if (prop === "realm") return realm;

    const tk = realm[REALM_TYPEKIT];

    return Reflect.get(tk, prop, tk);
  },
}) as unknown as DefaultTypekit;
