import { stringTemplateToString } from "./index.js";
import type {
  BooleanLiteral,
  MarshalledValue,
  NumericLiteral,
  ObjectLiteral,
  StringLiteral,
  TupleLiteral,
  Type,
  Value,
} from "./types.js";

export function marshallTypeForJS<T extends Type | Value>(type: T): MarshalledValue<T> {
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
    // In other case we keep the original tye
    default:
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
