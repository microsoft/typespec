import type { Checker } from "./checker.js";
import { compilerAssert } from "./diagnostics.js";
import { numericRanges } from "./numeric-ranges.js";
import { Numeric } from "./numeric.js";
import type {
  ArrayValue,
  MarshalledValue,
  NumericValue,
  ObjectValue,
  Type,
  Value,
} from "./types.js";

/**
 * Legacy marshalling of values to replicate before 0.56.0 behavior
 *  - string value -> `string`
 *  - numeric value -> `number`
 *  - boolean value -> `boolean`
 *  - null value -> `NullType`
 */
export function legacyMarshallTypeForJS(
  checker: Checker,
  value: Value,
): Type | Value | Record<string, unknown> | unknown[] | string | number | boolean {
  switch (value.valueKind) {
    case "BooleanValue":
    case "StringValue":
      return value.value;
    case "NumericValue":
      return Number(value.value.toString());
    case "ObjectValue":
      return objectValueToJs(value);
    case "ArrayValue":
      return arrayValueToJs(value);
    case "EnumValue":
      return value.value;
    case "NullValue":
      return checker.nullType;
    case "ScalarValue":
      return value;
  }
}

export function marshallTypeForJS<T extends Value>(
  value: T,
  valueConstraint: Type | undefined,
): MarshalledValue<T> {
  switch (value.valueKind) {
    case "BooleanValue":
    case "StringValue":
      return value.value as any;
    case "NumericValue":
      return numericValueToJs(value, valueConstraint) as any;
    case "ObjectValue":
      return objectValueToJs(value) as any;
    case "ArrayValue":
      return arrayValueToJs(value) as any;
    case "EnumValue":
      return value as any;
    case "NullValue":
      return null as any;
    case "ScalarValue":
      return value as any;
  }
}

export function canNumericConstraintBeJsNumber(type: Type | undefined): boolean {
  if (type === undefined) return true;
  switch (type.kind) {
    case "Scalar":
      return numericRanges[type.name as keyof typeof numericRanges]?.[2].isJsNumber;
    case "Union":
      return [...type.variants.values()].every((x) => canNumericConstraintBeJsNumber(x.type));
    default:
      return true;
  }
}

function numericValueToJs(type: NumericValue, valueConstraint: Type | undefined): number | Numeric {
  const canBeANumber = canNumericConstraintBeJsNumber(valueConstraint);
  if (canBeANumber) {
    const asNumber = type.value.asNumber();
    compilerAssert(
      asNumber !== null,
      `Numeric value '${type.value.toString()}' is not a able to convert to a number without loosing precision.`,
    );
    return asNumber;
  }
  return type.value;
}

function objectValueToJs(type: ObjectValue) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of type.properties) {
    result[key] = marshallTypeForJS(value.value, undefined);
  }
  return result;
}
function arrayValueToJs(type: ArrayValue) {
  return type.values.map((x) => marshallTypeForJS(x, undefined));
}
