import type { Program } from "../../core/program.js";
import { Realm } from "../realm.js";
import { Typekit, TypekitNamespaceSymbol, TypekitPrototype } from "./define-kit.js";

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

      // Wrap functions to set `this` correctly
      if (typeof value === "function") {
        const proxyWrapper = function (this: any, ...args: any[]) {
          // Call the original function (`value`) with the correct `this` (the proxy)
          return value.apply(proxy, args);
        };

        // functions may also have properties added to them, like in the case of `withDiagnostics`.
        // Copy enumerable properties from the original function (`value`) to the wrapper
        for (const propName of Object.keys(value)) {
          const originalPropValue = (value as any)[propName];

          if (typeof originalPropValue === "function") {
            // If the property is a function, wrap it to ensure `this` is bound correctly
            (proxyWrapper as any)[propName] = function (this: any, ...args: any[]) {
              // Call the original property function with `this` bound to the proxy
              return originalPropValue.apply(proxy, args);
            };
          } else {
            // If the property is not a function, copy it directly
            // Use Reflect.defineProperty to handle potential getters/setters correctly, though Object.keys usually only returns data properties.
            Reflect.defineProperty(
              proxyWrapper,
              propName,
              Reflect.getOwnPropertyDescriptor(value, propName)!,
            );
          }
        }

        return proxyWrapper;
      }

      // Only wrap objects marked as Typekit namespaces
      if (typeof value === "object" && value !== null && isTypekitNamespace(value)) {
        return new Proxy(value, handler); // Wrap namespace objects
      }

      return value;
    },
  };

  const proxy = new Proxy(tk, handler);
  return proxy;
}

// Helper function to check if an object is a Typekit namespace
function isTypekitNamespace(obj: any): boolean {
  return obj && !!obj[TypekitNamespaceSymbol];
}

// #region Default Typekit

const DEFAULT_REALM = Symbol.for("TypeSpec.Typekit.DEFAULT_TYPEKIT_REALM");

interface DefaultRealmStore {
  [DEFAULT_REALM]?: Realm;
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
 * Each typekit is associated with a Realm in which it operates.
 *
 * You can get the typekit associated with that realm by calling
 * `$` with the realm as an argument, or by calling `$` with a program
 * as an argument (in this case, it will use that program's default
 * typekit realm or create one if it does not already exist).
 *
 * @example
 * ```ts
 * import { unsafe_$ as $, Realm } from "@typespec/compiler/experimental";
 *
 * const realm = new Realm(program, "my custom realm");
 *
 * const clone = $(realm).type.clone(inputType);
 * ```
 *
 * @example
 * ```ts
 * import { unsafe_$ as $ } from "@typespec/compiler/experimental";
 *
 * const clone = $(program).type.clone(inputType);
 * ```
 *
 * @see {@link Realm}
 *
 * @experimental
 */
export const $ = _$;

// #endregion
