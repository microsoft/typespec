import type { DecoratorApplication, DecoratorFunction, RekeyableMap } from "../../core/types.js";
import { createRekeyableMap } from "../../utils/misc.js";
import { Typekit } from "./define-kit.js";

/**
 * Creates a shallow copy of a rekeyable map.
 *
 * @experimental
 */
export function copyMap<T, U>(map: RekeyableMap<T, U>): RekeyableMap<T, U> {
  return createRekeyableMap(map.entries());
}

/**
 * Decorator arguments can be either a single decorator (treated as a decorator with no arguments) or an array where the
 * first element is the decorator and the rest of the elements are the JavaScript values of the arguments.
 *
 * @experimental
 */
export type DecoratorArgs = DecoratorFunction | [DecoratorFunction, ...any[]];

/**
 * Utility function for converting a list of decorators and arguments into structure decorator applications that are
 * compatible with the TypeSpec type graph.
 *
 * Note: Not all JavaScript values can be converted faithfully to TypeSpec values. This function will attempt to convert
 * the value to a literal TypeSpec value if it is a primitive value, otherwise it will be left as a JavaScript value.
 * The `jsValue` property of the argument will always contain the original JavaScript value passed to the decorator.
 *
 * @param typekit - The Typekit instance to use for creating types and values.
 * @param decorators - The list of decorators and arguments to apply.
 *
 * @see {@link DecoratorArgs}
 *
 * @experimental
 */
export function decoratorApplication(
  typekit: Typekit,
  decorators?: DecoratorArgs[],
): DecoratorApplication[] {
  return (
    decorators?.map((arg) => {
      const [decorator, args] = Array.isArray(arg) ? [arg[0], arg.slice(1)] : [arg, []];

      return {
        decorator,
        args: args.map((rawValue: any) => ({
          value:
            typeof rawValue === "object" && rawValue !== null
              ? rawValue
              : typekit.literal.create(rawValue),
          jsValue: rawValue,
        })),
      };
    }) ?? []
  );
}
