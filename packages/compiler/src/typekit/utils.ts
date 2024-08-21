import type { DecoratorApplication, DecoratorFunction, RekeyableMap } from "../core/types.js";
import { createRekeyableMap } from "../utils/misc.js";
import { $ } from "./define-kit.js";

export function copyMap<T, U>(map: RekeyableMap<T, U>): RekeyableMap<T, U> {
  return createRekeyableMap(Array.from(map.entries()));
}

export type DecoratorArgs = DecoratorFunction | [DecoratorFunction, ...any[]];

export function decoratorApplication(args?: DecoratorArgs[]): DecoratorApplication[] {
  if (!args) {
    return [];
  }

  const decorators: DecoratorApplication[] = [];
  for (const arg of args) {
    decorators.push({
      decorator: Array.isArray(arg) ? arg[0] : arg,
      args: Array.isArray(arg)
        ? arg.slice(1).map((rawValue: any) => ({
            value:
              typeof rawValue === "object" && rawValue !== null
                ? rawValue
                : $.literal.create(rawValue),
            jsValue: rawValue,
          }))
        : [],
    });
  }

  return decorators;
}
