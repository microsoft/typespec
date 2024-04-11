import { isValue, typespecTypeToJson } from "./index.js";
import type {
  ArrayValue,
  BooleanValue,
  Diagnostic,
  MarshalledValue,
  Model,
  NumericValue,
  ObjectValue,
  StringValue,
  Tuple,
  Type,
  Value,
} from "./types.js";

export function tryMarshallTypeForJS<T extends Type | Value>(type: T): MarshalledValue<T> {
  if (isValue(type)) {
    return marshallTypeForJS(type);
  }
  return type as any;
}

/** Legacy version that will cast models to object literals and tuple to tuple literals */
export function marshallTypeForJSWithLegacyCast<T extends Value | Model | Tuple>(
  type: T
): [MarshalledValue<T> | undefined, readonly Diagnostic[]] {
  if ("kind" in type) {
    return typespecTypeToJson(type, type) as any;
  } else {
    return [marshallTypeForJS(type) as any, []];
  }
}
export function marshallTypeForJS<T extends Value>(type: T): MarshalledValue<T> {
  switch (type.valueKind) {
    case "BooleanValue":
    case "StringValue":
    case "NumericValue":
      return primitiveValueToJs(type) as any;
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

function primitiveValueToJs<T extends NumericValue | StringValue | BooleanValue>(
  type: T
): MarshalledValue<T> {
  return type.value as any;
}

function objectValueToJs(type: ObjectValue) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of type.properties) {
    result[key] = marshallTypeForJS(value.value);
  }
  return result;
}
function arrayValueToJs(type: ArrayValue) {
  return type.values.map(marshallTypeForJS);
}
