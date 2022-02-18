import { getIntrinsicType } from "../lib/decorators.js";
import { IntrinsicModelName } from "./index.js";
import { createDiagnostic, reportDiagnostic } from "./messages.js";
import { Program } from "./program.js";
import { Type } from "./types.js";

export type CadlValue = Type | string | number | boolean;

// prettier-ignore
export type InferredCadlValue<K extends Type["kind"]> = 
  K extends "String" ? string 
  : K extends "Number" ? number 
  : K extends "Boolean" ? boolean 
  : Type & { kind: K };

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
  const isCorrectType = isCadlValueTypeOf(target, expectedType);
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

export function validateDecoratorTargetIntrinsic(
  program: Program,
  target: Type,
  decoratorName: string,
  intrinsicType: IntrinsicModelName
): boolean {
  if (getIntrinsicType(program, target)?.name !== "string") {
    program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: { decorator: decoratorName, to: `non '${intrinsicType}' type` },
        target,
      })
    );
    return false;
  }
  return true;
}
/**
 * Check if the given target is of any of the cadl types.
 * @param target Target to validate.
 * @param expectedType One or multiple allowed cadl types.
 * @returns boolean if the target is of one of the allowed types.
 */
export function isCadlValueTypeOf<K extends Type["kind"]>(
  target: CadlValue,
  expectedType: K | K[]
): target is InferredCadlValue<K> {
  const kind = getTypeKind(target);
  if (kind === undefined) {
    return false;
  }

  return typeof expectedType === "string"
    ? kind === expectedType
    : expectedType.includes(kind as any);
}

function getTypeKind(target: CadlValue): Type["kind"] | undefined {
  switch (typeof target) {
    case "object":
      return target.kind;
    case "string":
      return "String";
    case "number":
      return "Number";
    case "boolean":
      return "Boolean";
    default:
      return undefined;
  }
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
 * Validate a decorator parameter has the correct type.
 * @param program Program
 * @param target Decorator target
 * @param value Value of the parameter.
 * @param expectedType Expected type or list of expected type
 * @returns true if the value is of one of the type in the list of expected types. If not emit a diagnostic.
 */
export function validateDecoratorParamType<K extends Type["kind"]>(
  program: Program,
  target: Type,
  value: CadlValue,
  expectedType: K | K[]
): value is InferredCadlValue<K> {
  if (!isCadlValueTypeOf(value, expectedType)) {
    reportDiagnostic(program, {
      code: "invalid-argument",
      format: {
        value: prettyValue(program, value),
        actual: getTypeKind(value)!,
        expected: typeof expectedType === "string" ? expectedType : expectedType.join(", "),
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
