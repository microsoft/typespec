import { type Typekit, TypekitPrototype } from "../../typekit/define-kit.js";
import { Realm } from "../realm.js";

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

      // Wrap objects to ensure their functions are bound correctly, avoid wrapping `get` accessors
      if (
        typeof value === "object" &&
        value !== null &&
        !Reflect.getOwnPropertyDescriptor(target, prop)?.get
      ) {
        return new Proxy(value, handler);
      }

      return value;
    },
  };

  const proxy = new Proxy(tk, handler);
  return proxy;
}
