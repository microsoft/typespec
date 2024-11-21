import { compilerAssert, Program } from "../../core/index.js";
import { Realm } from "../realm.js";
import { Typekit, TypekitPrototype } from "./define-kit.js";

export * from "./define-kit.js";
export * from "./kits/index.js";

/**
 * Create a new Typekit that operates in the given realm.
 *
 * Ordinarily, you should use the default typekit `$` to manipulate types in the current program, or call `$` with a
 * Realm or Program as the first argument if you want to work in a specific realm or in the default typekit realm of
 * a specific program.
 *
 * @param realm - The realm to create the typekit in.
 *
 * @experimental
 */
export function createTypekit(realm: Realm): Typekit {
  const tk = Object.create(TypekitPrototype);

  const handler: ProxyHandler<Typekit> = {
    get(target, prop, receiver) {
      if (prop === "program") {
        // don't wrap program (probably need to ensure this isn't a nested program somewhere)
        return realm.program;
      }

      if (prop === "realm") {
        return realm;
      }

      const value = Reflect.get(target, prop, receiver);

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

// #region Default Typekit

const CURRENT_PROGRAM = Symbol.for("TypeSpec.Typekit.CURRENT_PROGRAM");
const DEFAULT_REALM = Symbol.for("TypeSpec.Typekit.DEFAULT_TYPEKIT_REALM");

function getCurrentProgram(): Program | undefined {
  return (globalThis as any)[CURRENT_PROGRAM];
}

/**
 * Sets a given program as the current program for Typekit operations.
 *
 * This is necessary to enable use of the default Typekit `$` and should be
 * called whenever the compiler is working with a specific program
 *
 * @param program - The program to set as the current program.
 *
 * @internal
 */
export function setCurrentProgram(program: Program) {
  (globalThis as any)[CURRENT_PROGRAM] = program;
}

interface DefaultRealmStore {
  [DEFAULT_REALM]?: Realm;
}

/** @experimental */
interface DefaultTypekit extends Typekit {
  /**
   * Create or get the default typekit for the given Realm.
   *
   * @see {@link Realm}
   *
   * @param realm - The realm to get the typekit for.
   * @returns The default typekit for the realm.
   */
  (realm: Realm): Typekit;

  /**
   * Create or get the default typekit for the given Program.
   *
   * If a default typekit realm for the given program does not exist, one will be created.
   *
   * @param program - The program to get the typekit for.
   * @returns The default typekit for the program.
   */
  (program: Program): Typekit;
}

function _$(realm: Realm): Typekit;
function _$(program: Program): Typekit;
function _$(arg: Realm | Program): Typekit {
  let realm: Realm;
  if (Object.hasOwn(arg, "projectRoot")) {
    // arg is a Program
    realm = (arg as DefaultRealmStore)[DEFAULT_REALM] ??= new Realm(
      arg as Program,
      "default typekit realm",
    );
  } else {
    // arg is a Realm
    realm = arg as Realm;
  }

  return realm.typekit;
}

/**
 * Typekit - Utilities for working with TypeSpec types.
 *
 * The default typekit `$` can be used to manipulate types in the current program.
 *
 * Each typekit is associated with a Realm in which it operates. The default typekit
 * will use the default typekit realm for the current program.
 *
 * Alternatively, to work in a specific realm, you can get the typekit associated
 * with that realm by calling `$` with the realm as an argument, or by calling
 * `$` with a program as an argument (in this case, it will use that program's
 * default typekit realm or create one if it does not already exist).
 *
 * @example
 * ```ts
 * import { $ } from "@typespec/compiler/experimental";
 *
 * const clone = $.type.clone(inputType);
 * ```
 *
 * @example
 * ```ts
 * import { $, Realm } from "@typespec/compiler/experimental";
 *
 * const realm = new Realm(program, "my custom realm");
 *
 * const clone = $(realm).type.clone(inputType);
 * ```
 *
 * @example
 * ```ts
 * import { $ } from "@typespec/compiler/experimental";
 *
 * const projectedProgram = projectProgram(program, ...);
 *
 * const clone = $(projectedProgram).type.clone(inputType);
 * ```
 *
 * @see {@link Realm}
 *
 * @experimental
 */
export const $: DefaultTypekit = new Proxy(_$, {
  get(_target, prop, _receiver) {
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

    const tk = _$(realm);

    return Reflect.get(tk, prop, tk);
  },
}) as unknown as DefaultTypekit;

// #endregion
