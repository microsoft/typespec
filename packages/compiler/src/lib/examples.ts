import type { Model, ObjectValue, ScalarValue, Type, Value } from "../core/types.js";

/**
 * Serialize the given TypeSpec value as a JSON object using the given type and its encoding annotations.
 * The Value MUST be assignable to the given type.
 */
export function serializeValueAsJson(value: Value, type: Type): unknown {
  switch (value.valueKind) {
    case "NullValue":
      return null;
    case "BooleanValue":
    case "StringValue":
      return value.value;
    case "NumericValue":
      return value.value.asNumber();
    case "EnumValue":
      return value.value.value ?? value.value.name;
    case "ArrayValue":
      return value.values.map((v) => serializeValueAsJson(v, type));
    case "ObjectValue":
      return serializeObjectValueAsJson(value, type as Model);
    case "ScalarValue":
      return serializeScalarValueAsJson(value, type);
  }
}

function serializeObjectValueAsJson(value: ObjectValue, type: Model): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const propValue of value.properties.values()) {
    const definition = type.properties.get(propValue.name);
    if (definition) {
      obj[propValue.name] = serializeValueAsJson(propValue.value, definition.type);
    }
  }
  return obj;
}

function serializeScalarValueAsJson(value: ScalarValue, type: Type): unknown {
  return serializeValueAsJson(value.value.args[0], value.value.args[0].type);
}
