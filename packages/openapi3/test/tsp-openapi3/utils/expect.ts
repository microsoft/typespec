import { DecoratorApplication, isType, Numeric, typespecTypeToJson } from "@typespec/compiler";
import { expect } from "vitest";

export interface DecoratorMatch {
  /**
   * The name of the decorator without the "@" prefix.
   */
  name: string;

  /**
   * The arguments passed into the decorator.
   */
  args?: any[];
}

export interface ExpectDecoratorsOptions {
  strict?: boolean;
}

export function expectDecorators(
  decorators: DecoratorApplication[],
  matches: DecoratorMatch | DecoratorMatch[],
  options: ExpectDecoratorsOptions = { strict: true },
) {
  const expectations = Array.isArray(matches) ? matches : [matches];

  if (options.strict) {
    expect(decorators).toHaveLength(expectations.length);
  }

  for (let i = 0; i < expectations.length; i++) {
    const decorator = decorators[i];
    const expectation = expectations[i];

    if (expectation.name) {
      expect(decorator.definition?.name).toBe(`@${expectation.name}`);
    }

    if (expectation.args) {
      const actualArgs = decorator.args.map((arg: any) => {
        if (isType(arg)) return arg;
        if ("jsValue" in arg) {
          if (isType(arg.jsValue) && arg.jsValue.kind === "Model") {
            return typespecTypeToJson(arg.jsValue, arg.jsValue)[0];
          }
          return arg.jsValue;
        }
        return arg;
      });
      const args = expectation.args.map(transformDecoratorArg);
      expect(actualArgs).toMatchObject(args);
    }
  }
}

function transformDecoratorArg(arg: any) {
  if (isType(arg)) return arg;

  if (typeof arg === "number") {
    return { jsValue: Numeric(`${arg}`) };
  }

  return arg;
}
