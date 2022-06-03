import { getIntrinsicModelName, getPropertyType } from "../lib/decorators.js";
import { DecoratorContext } from "./index.js";
import { createDiagnostic, reportDiagnostic } from "./messages.js";
import { Program } from "./program.js";
import {
  Diagnostic,
  DiagnosticTarget,
  IntrinsicModelName,
  ModelType,
  ModelTypeProperty,
  Type,
} from "./types.js";

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
  context: DecoratorContext,
  target: Type,
  decoratorName: string,
  expectedType: K | K[]
): target is Type & { kind: K } {
  const isCorrectType = isCadlValueTypeOf(target, expectedType);
  if (!isCorrectType) {
    reportDiagnostic(context.program, {
      code: "decorator-wrong-target",
      format: {
        decorator: decoratorName,
        to: target.kind,
      },
      target: context.decoratorTarget,
    });
    return false;
  }

  return true;
}

export function validateDecoratorTargetIntrinsic(
  context: DecoratorContext,
  target: ModelType | ModelTypeProperty,
  decoratorName: string,
  expectedType: IntrinsicModelName | IntrinsicModelName[]
): boolean {
  const actualType = getIntrinsicModelName(context.program, getPropertyType(target));
  const isCorrect =
    actualType &&
    (typeof expectedType === "string"
      ? actualType === expectedType
      : expectedType.includes(actualType));
  if (!isCorrect) {
    context.program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: {
          decorator: decoratorName,
          to: `type it is not one of: ${
            typeof expectedType === "string" ? expectedType : expectedType.join(", ")
          }`,
        },
        target: context.decoratorTarget,
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
 * Validate a decorator parameter has the correct type.
 * @param program Program
 * @param target Decorator target
 * @param value Value of the parameter.
 * @param expectedType Expected type or list of expected type
 * @returns true if the value is of one of the type in the list of expected types. If not emit a diagnostic.
 * @deprecated use @see createDecoratorDefinition#validate instead.
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

export interface DecoratorDefinition<
  T extends Type["kind"],
  P extends readonly DecoratorParamDefinition<any>[]
> {
  readonly name: string;
  readonly target: T | T[];
  readonly args: P;
}

export interface DecoratorParamDefinition<K extends Type["kind"]> {
  readonly kind: K | K[];
  readonly optional?: boolean;
}

type InferParameters<P extends readonly DecoratorParamDefinition<any>[]> = {
  [K in keyof P]: InferParameter<P[K]>;
};
type InferParameter<P extends DecoratorParamDefinition<any>> = P["optional"] extends true
  ? InferredCadlValue<P["kind"]> | undefined
  : InferredCadlValue<P["kind"]>;

export interface DecoratorValidator<
  T extends Type["kind"],
  P extends readonly DecoratorParamDefinition<any>[]
> {
  validate(
    context: DecoratorContext,
    target: InferredCadlValue<T>,
    parameters: InferParameters<P>
  ): boolean;
}

export function createDecoratorDefinition<
  T extends Type["kind"],
  P extends readonly DecoratorParamDefinition<any>[]
>(definition: DecoratorDefinition<T, P>): DecoratorValidator<T, P> {
  const minParams = definition.args.filter((x) => !x.optional).length;
  const maxParams = definition.args.length;

  function validate(context: DecoratorContext, target: Type, args: CadlValue[]) {
    if (
      !validateDecoratorTarget(context, target, definition.name, definition.target) ||
      !validateDecoratorParamCount(context, minParams, maxParams, args)
    ) {
      return false;
    }

    for (const [index, arg] of args.entries()) {
      const paramDefinition = definition.args[index];
      if (arg === undefined) {
        if (!paramDefinition.optional) {
          reportDiagnostic(context.program, {
            code: "invalid-argument",
            format: {
              value: "undefined",
              actual: "undefined",
              expected: expectedTypeList(paramDefinition.kind),
            },
            target: context.getArgumentTarget(index)!,
          });
          return false;
        }
      } else if (!isCadlValueTypeOf(arg, paramDefinition.kind)) {
        console.log("Report diagnostic", index, arg, context.getArgumentTarget(index));

        reportDiagnostic(context.program, {
          code: "invalid-argument",
          format: {
            value: prettyValue(context.program, arg),
            actual: getTypeKind(arg)!,
            expected: expectedTypeList(paramDefinition.kind),
          },
          target: context.getArgumentTarget(index)!,
        });
        return false;
      }
    }

    return true;
  }

  return {
    validate(context: DecoratorContext, target, parameters) {
      return validate(context, target as any, parameters as any);
    },
  };
}

function expectedTypeList(expectedType: Type["kind"] | Type["kind"][]) {
  return typeof expectedType === "string" ? expectedType : expectedType.join(", ");
}

export function validateDecoratorParamCount(
  context: DecoratorContext,
  min: number,
  max: number,
  parameters: unknown[]
): boolean {
  if (parameters.length < min || parameters.length > max) {
    if (min === max) {
      reportDiagnostic(context.program, {
        code: "invalid-argument-count",
        format: {
          actual: parameters.length.toString(),
          expected: min.toString(),
        },
        target: context.decoratorTarget,
      });
    } else {
      reportDiagnostic(context.program, {
        code: "invalid-argument-count",
        messageId: "between",
        format: {
          actual: parameters.length.toString(),
          min: min.toString(),
          max: max.toString(),
        },
        target: context.decoratorTarget,
      });
    }
    return false;
  }
  return true;
}

function prettyValue(program: Program, value: any) {
  if (typeof value === "object" && value !== null && "kind" in value) {
    return program.checker.getTypeName(value);
  }
  return value;
}

/**
 * Convert a cadl type to a serializable Json object.
 * Emits diagnostics if the given type is invalid
 * @param cadlType The type to convert to Json data
 * @param target The diagnostic target in case of errors.
 */
export function cadlTypeToJson<T>(
  cadlType: CadlValue,
  target: DiagnosticTarget
): [T | undefined, Diagnostic[]] {
  if (typeof cadlType !== "object") {
    return [cadlType as any, []];
  }
  return cadlTypeToJsonInternal(cadlType, target, []);
}

function cadlTypeToJsonInternal(
  cadlType: Type,
  target: DiagnosticTarget,
  path: string[]
): [any | undefined, Diagnostic[]] {
  switch (cadlType.kind) {
    case "String":
    case "Boolean":
    case "Number":
      return [cadlType.value, []];
    case "Tuple": {
      const result = [];
      for (const [index, type] of cadlType.values.entries()) {
        const [item, diagnostics] = cadlTypeToJsonInternal(type, target, [
          ...path,
          index.toString(),
        ]);
        if (diagnostics.length > 0) {
          return [undefined, diagnostics];
        }
        result.push(item);
      }
      return [result, []];
    }
    case "Model": {
      const result: Record<string, any> = {};
      for (const [name, type] of cadlType.properties.entries()) {
        const [item, diagnostics] = cadlTypeToJsonInternal(type.type, target, [
          ...path,
          name.toString(),
        ]);
        if (diagnostics.length > 0) {
          return [undefined, diagnostics];
        }
        result[name] = item;
      }
      return [result, []];
    }
    default:
      const diagnostic =
        path.length === 0
          ? createDiagnostic({
              code: "invalid-value",
              format: {
                kind: cadlType.kind,
              },
              target,
            })
          : createDiagnostic({
              code: "invalid-value",
              messageId: "atPath",
              format: {
                kind: cadlType.kind,
                path: path.join("."),
              },
              target,
            });
      return [undefined, [diagnostic]];
  }
}
