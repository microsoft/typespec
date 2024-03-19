import { isValueType, stringTemplateToString, typespecTypeToJson } from "./index.js";
import type {
  BooleanLiteral,
  Diagnostic,
  MarshalledValue,
  Model,
  NumericLiteral,
  ObjectLiteral,
  StringLiteral,
  Tuple,
  TupleLiteral,
  Type,
  Value,
} from "./types.js";

export function tryMarshallTypeForJS<T extends Type | Value>(type: T): MarshalledValue<T> {
  if (isValueType(type)) {
    return marshallTypeForJS(type);
  }
  return type as any;
}

/** Legacy version that will cast models to object literals and tuple to tuple literals */
export function marshallTypeForJSWithLegacyCast<T extends Value | Model | Tuple>(
  type: T
): [MarshalledValue<T> | undefined, readonly Diagnostic[]] {
  switch (type.kind) {
    case "Model":
    case "Tuple":
      return typespecTypeToJson(type, type) as any;
    default:
      return [marshallTypeForJS(type) as any, []];
  }
}
export function marshallTypeForJS<T extends Value>(type: T): MarshalledValue<T> {
  switch (type.kind) {
    case "Boolean":
    case "String":
    case "Number":
      return literalTypeToValue(type) as any;
    case "StringTemplate":
      return stringTemplateToString(type)[0] as any;
    case "ObjectLiteral":
      return objectLiteralToValue(type) as any;
    case "TupleLiteral":
      return tupleLiteralToValue(type) as any;
    case "EnumMember":
      return type as any;
  }
}

function literalTypeToValue<T extends StringLiteral | NumericLiteral | BooleanLiteral>(
  type: T
): MarshalledValue<T> {
  return type.value as any;
}

function objectLiteralToValue(type: ObjectLiteral) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of type.properties) {
    result[key] = marshallTypeForJS(value);
  }
  return result;
}
function tupleLiteralToValue(type: TupleLiteral) {
  return type.values.map(marshallTypeForJS);
}
