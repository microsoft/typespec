import { currentProgram, type Program } from "../core/program.js";

export interface TypekitPrototype {
  program: Program;
}

export const TypekitPrototype: Record<string, unknown> = {};

export function createTypekit(): TypekitPrototype {
  let tk = Object.create(TypekitPrototype);

  Object.defineProperty(tk, "program", {
    get() {
      return currentProgram;
    },
  });

  const handler: ProxyHandler<TypekitPrototype> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "program") {
        // don't wrap program (probably need to ensure this isn't a nested program somewhere)
        return value;
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

export interface TypekitContext {
  program: Program;
}

// contextual typing to type guards is annoying (often have to restate the
// signature), so this helper will remove the type assertions from the interface
// you are currently defining.
export type StripGuards<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => R
    : StripGuards<T[K]>;
};

export function defineKit<T extends Record<string, any>>(
  source: StripGuards<T> & ThisType<TypekitPrototype>
): void {
  for (const [name, fnOrNs] of Object.entries(source)) {
    TypekitPrototype[name] = fnOrNs;
  }
}

export const $: TypekitPrototype = createTypekit();
