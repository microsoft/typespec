import { reportDiagnostic } from "./messages.js";
import { Program } from "./program.js";
import { Type } from "./types.js";

/**
 * Validate the decorator target is matching the expected value.
 * @param program
 * @param target
 * @param expectedType
 * @param decoratorName
 * @returns
 */
export function validateDecoratorTarget<K extends Type["kind"]>(
  program: Program,
  target: Type,
  decoratorName: string,
  expectedType: K | K[]
): target is Type & { kind: K } {
  const isCorrectType =
    typeof expectedType === "string"
      ? target.kind === expectedType
      : expectedType.includes(target.kind as any);

  if (!isCorrectType) {
    reportDiagnostic(program, {
      code: "decorator-wrong-target",
      format: {
        decorator: decoratorName,
        to: target.kind,
      },
      target,
    });
    return false;
  }

  return true;
}

/**
 * Emit diagnostic if the number of arguments passed to decorator is more or less than the expected count.
 */
export function validateDecoratorParamCount(
  program: Program,
  target: Type,
  args: unknown[],
  expected: number
) {
  if (args.length !== expected) {
    reportDiagnostic(program, {
      code: "invalid-argument-count",
      format: {
        actual: args.length.toString(),
        expected: expected.toString(),
      },
      target,
    });
    return;
  }
}

/**
 * Validate the given
 */
export function validateDecoratorParamType(
  program: Program,
  target: Type,
  value: unknown,
  expected: "string" | "number"
): boolean {
  if (typeof value !== expected) {
    reportDiagnostic(program, {
      code: "invalid-argument",
      format: {
        value: prettyValue(program, value),
        actual: typeof value,
        expected: expected,
      },
      target,
    });
    return false;
  }
  return true;
}

function prettyValue(program: Program, value: any) {
  if (typeof value === "object" && value !== null && "kind" in value) {
    return program.checker!.getTypeName(value);
  }
  return value;
}
