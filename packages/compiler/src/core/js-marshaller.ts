import { $ } from "../typekit/index.js";
import { compilerAssert } from "./diagnostics.js";
import { numericRanges } from "./numeric-ranges.js";
import { Numeric } from "./numeric.js";
import { Program } from "./program.js";
import type {
  ArrayValue,
  MarshalledValue,
  NumericValue,
  ObjectValue,
  ObjectValuePropertyDescriptor,
  Scalar,
  Type,
  UnknownValue,
  Value,
} from "./types.js";

export function marshalTypeForJs<T extends Value>(
  value: T,
  valueConstraint: Type | undefined,
  onUnknown: (value: UnknownValue) => void,
): MarshalledValue<T> {
  switch (value.valueKind) {
    case "BooleanValue":
    case "StringValue":
      return value.value as any;
    case "NumericValue":
      return numericValueToJs(value, valueConstraint) as any;
    case "ObjectValue":
      return objectValueToJs(value, onUnknown) as any;
    case "ArrayValue":
      return arrayValueToJs(value, onUnknown) as any;
    case "EnumValue":
      return value as any;
    case "NullValue":
      return null as any;
    case "ScalarValue":
      return value as any;
    case "UnknownValue":
      onUnknown(value);
      return null as any;
  }
}

function isNumericScalar(scalar: Scalar) {
  let current: Scalar | undefined = scalar;

  while (current) {
    if (current.name === "numeric" && current.namespace?.name === "TypeSpec") {
      return true;
    }
    current = current.baseScalar;
  }
  return false;
}

export function canNumericConstraintBeJsNumber(type: Type | undefined): boolean {
  if (type === undefined) return true;
  switch (type.kind) {
    case "Scalar":
      if (isNumericScalar(type)) {
        return numericRanges[type.name as keyof typeof numericRanges]?.[2].isJsNumber;
      } else {
        return true;
      }
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

function objectValueToJs(
  type: ObjectValue,
  onUnknown: (value: UnknownValue) => void,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of type.properties) {
    result[key] = marshalTypeForJs(value.value, undefined, onUnknown);
  }
  return result;
}
function arrayValueToJs(type: ArrayValue, onUnknown: (value: UnknownValue) => void) {
  return type.values.map((x) => marshalTypeForJs(x, undefined, onUnknown));
}

export function unmarshalJsToValue(
  program: Program,
  value: unknown,
  onInvalid: (value: unknown) => void,
): Value {
  if (
    typeof value === "object" &&
    value !== null &&
    "entityKind" in value &&
    value.entityKind === "Value"
  ) {
    return value as Value;
  }

  if (value === null || value === undefined) {
    return {
      entityKind: "Value",
      valueKind: "NullValue",
      value: null,
      type: program.checker.nullType,
    };
  } else if (typeof value === "boolean") {
    const boolean = program.checker.getStdType("boolean");
    return {
      entityKind: "Value",
      valueKind: "BooleanValue",
      value,
      type: boolean,
      scalar: boolean,
    };
  } else if (typeof value === "string") {
    const string = program.checker.getStdType("string");
    return {
      entityKind: "Value",
      valueKind: "StringValue",
      value,
      type: string,
      scalar: string,
    };
  } else if (typeof value === "number") {
    const numeric = Numeric(String(value));
    const numericType = program.checker.getStdType("numeric");
    return {
      entityKind: "Value",
      valueKind: "NumericValue",
      value: numeric,
      type: $(program).literal.create(value),
      scalar: numericType,
    };
  } else if (Array.isArray(value)) {
    const values: Value[] = [];
    const uniqueTypes = new Set<Type>();

    for (const item of value) {
      const itemValue = unmarshalJsToValue(program, item, onInvalid);
      values.push(itemValue);
      uniqueTypes.add(itemValue.type);
    }

    return {
      entityKind: "Value",
      valueKind: "ArrayValue",
      type: $(program).array.create($(program).union.create([...uniqueTypes])),
      values,
    };
  } else if (typeof value === "object" && !("entityKind" in value)) {
    const properties: Map<string, ObjectValuePropertyDescriptor> = new Map();
    for (const [key, val] of Object.entries(value)) {
      properties.set(key, { name: key, value: unmarshalJsToValue(program, val, onInvalid) });
    }
    return {
      entityKind: "Value",
      valueKind: "ObjectValue",
      properties,
      type: $(program).model.create({
        properties: Object.fromEntries(
          [...properties.entries()].map(
            ([k, v]) =>
              [k, $(program).modelProperty.create({ name: k, type: v.value.type })] as const,
          ),
        ),
      }),
    };
  } else {
    onInvalid(value);
    return {
      entityKind: "Value",
      valueKind: "UnknownValue",
      type: program.checker.neverType,
    };
  }
}
