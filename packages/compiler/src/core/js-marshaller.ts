import { compilerAssert } from "./diagnostics.js";
import { numericRanges } from "./numeric-ranges.js";
import { Numeric } from "./numeric.js";
import type {
  ArrayValue,
  Diagnostic,
  MarshalledValue,
  NumericValue,
  ObjectValue,
  Type,
  Value,
} from "./types.js";

/** Legacy version that will cast models to object literals and tuple to tuple literals */
export function marshallTypeForJSWithLegacyCast<T extends Value>(
  value: Value,
  valueConstraint: Type
): [MarshalledValue<T> | undefined, readonly Diagnostic[]] {
  return [marshallTypeForJS(value, valueConstraint) as any, []];
}
export function marshallTypeForJS<T extends Value>(
  type: T,
  valueConstraint: Type | undefined
): MarshalledValue<T> {
  switch (type.valueKind) {
    case "BooleanValue":
    case "StringValue":
      return type.value as any;
    case "NumericValue":
      return numericValueToJs(type, valueConstraint) as any;
    case "ObjectValue":
      return objectValueToJs(type) as any;
    case "ArrayValue":
      return arrayValueToJs(type) as any;
    case "EnumValue":
      return type.value as any;
    case "NullValue":
      return null as any;
    case "ScalarValue":
      return type as any;
  }
}

function canNumericConstraintBeJsNumber(type: Type | undefined): boolean {
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
      `Numeric value '${type.value.toString()}' is not a able to convert to a number without loosing precision.`
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
