import * as cs from "@alloy-js/csharp";
import {
  getFriendlyName,
  getMinValue,
  type Enum,
  type Model,
  type ModelProperty,
  type Program,
  type Type,
  type Union,
  type Value,
} from "@typespec/compiler";
import type { useTsp } from "@typespec/emitter-framework";
import { isStatusCode } from "@typespec/http";
import { getUnionEnumMembers, isUnionEnum } from "../enums/enums.jsx";
import { assignAnonymousName } from "./anonymous-models.js";

/** Gets the string representation of a literal or default value. */
export function getLiteralValue(
  type: Type,
  collectionType?: "array" | "enumerable",
): string | undefined {
  if (type.kind === "String") return `"${type.value}"`;
  if (type.kind === "Boolean") return type.value ? "true" : "false";
  if (type.kind === "Number") return String(type.value);
  if (type.kind === "StringTemplate" && (type as any).stringValue !== undefined) {
    return `"${(type as any).stringValue}"`;
  }
  if (type.kind === "Tuple") {
    const elements = type.values.map((v) => getLiteralValue(v));
    if (elements.every((e) => e !== undefined)) {
      if (collectionType === "enumerable") {
        // Determine the C# element type from the first value
        const firstType = type.values[0];
        const csElementType =
          firstType.kind === "Number"
            ? Number.isInteger(firstType.value)
              ? "int"
              : "double"
            : firstType.kind === "String"
              ? "string"
              : firstType.kind === "Boolean"
                ? "bool"
                : "object";
        return `new List<${csElementType}> {${elements.join(", ")}}`;
      }
      // Array mode: use C# 12 collection expression
      return `[${elements.join(", ")}]`;
    }
  }
  return undefined;
}

/** Gets the string representation of a Value (for defaultValue). */
export function getDefaultValueString(value: Value): string | undefined {
  if (value.valueKind === "StringValue") return `"${value.value}"`;
  if (value.valueKind === "BooleanValue") return value.value ? "true" : "false";
  if (value.valueKind === "NumericValue") return String(value.value);
  return undefined;
}

/**
 * For a union variant type (e.g., kind: PetType.Dog), returns a C# enum member
 * initializer like "PetType.Dog". Returns undefined if not a union-enum variant.
 */
export function getUnionVariantInitializer(
  type: Type,
  namePolicy: ReturnType<typeof cs.createCSharpNamePolicy>,
): string | undefined {
  if (type.kind !== "UnionVariant") return undefined;
  const union = type.union;
  if (!union || !isUnionEnum(union)) return undefined;

  const enumName = namePolicy.getName(union.name!, "enum");
  const memberName = namePolicy.getName(String(type.name), "enum-member");
  return `${enumName}.${memberName}`;
}

/**
 * For a property with a default value that references an enum or union-enum member,
 * returns the C# enum member string like "WolfBreed.Dire".
 */
export function getEnumDefaultInitializer(
  property: ModelProperty,
  namePolicy: ReturnType<typeof cs.createCSharpNamePolicy>,
): string | undefined {
  if (!property.defaultValue) return undefined;
  const dv = property.defaultValue;

  // Handle TypeSpec enum default values
  if (dv.valueKind === "EnumValue") {
    const enumType = dv.value.enum;
    if (enumType) {
      const enumName = namePolicy.getName(enumType.name, "enum");
      const memberName = namePolicy.getName(dv.value.name, "enum-member");
      return `${enumName}.${memberName}`;
    }
  }

  // Handle union-enum default values (StringValue matching a union variant)
  if (
    dv.valueKind === "StringValue" &&
    property.type.kind === "Union" &&
    isUnionEnum(property.type)
  ) {
    const members = getUnionEnumMembers(property.type);
    const match = members.find((m) => m.value === dv.value);
    if (match) {
      const enumName = namePolicy.getName(property.type.name!, "enum");
      const memberName = namePolicy.getName(match.name, "enum-member");
      return `${enumName}.${memberName}`;
    }
  }

  return undefined;
}

/** Checks if a property name exists anywhere in the model's base chain. */
export function hasPropertyInChain(model: Model | undefined, propName: string): boolean {
  let current = model;
  while (current) {
    if (current.properties.has(propName)) return true;
    current = current.baseModel;
  }
  return false;
}

/** For literal types, get the underlying scalar type for the property declaration. */
export function getScalarForLiteral(type: Type): Type {
  // Literal types don't have a .scalar reference in the compiler types
  // We just return the original type and let TypeExpression handle it
  return type;
}

/** Returns true if the enum has any non-integer member values (float enums can't be C# enums). */
export function hasNonIntegerValues(en: Enum): boolean {
  for (const member of en.members.values()) {
    if (typeof member.value === "number" && !Number.isInteger(member.value)) {
      return true;
    }
  }
  return false;
}

/** Returns true if the TypeSpec type maps to a C# value type (struct). */
export function isValueType($: ReturnType<typeof useTsp>["$"], type: Type): boolean {
  // Handle literal types
  if (type.kind === "Boolean" || type.kind === "Number") return true;
  if (type.kind === "String") return false;

  if ($.scalar.is(type)) {
    const baseName = $.scalar.getStdBase(type)?.name ?? type.name;
    const valueTypes = new Set([
      "int8",
      "int16",
      "int32",
      "int64",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "safeint",
      "float32",
      "float64",
      "decimal",
      "decimal128",
      "boolean",
      "numeric",
      "integer",
      "float",
      "plainDate",
      "plainTime",
      "utcDateTime",
      "offsetDateTime",
      "duration",
      "unixTimestamp32",
    ]);
    return valueTypes.has(baseName);
  }
  if ($.enum.is(type)) return true;
  if (type.kind === "Union" && isUnionEnum(type as Union)) return true;
  return false;
}

/** Returns true if any property of the model uses Record<T> (mapped to JsonObject). */
export function modelNeedsJsonNodes($: ReturnType<typeof useTsp>["$"], model: Model): boolean {
  for (const prop of model.properties.values()) {
    if (prop.type.kind === "Model" && $.record.is(prop.type)) {
      // Only need JsonNodes for Record<unknown> (maps to JsonObject)
      const valueType = prop.type.indexer?.value;
      if (valueType?.kind === "Intrinsic" && valueType.name === "unknown") return true;
    }
  }
  return false;
}

// Exception property names that conflict with C# Exception class
const exceptionPropertyNames = [
  "value",
  "headers",
  "stacktrace",
  "source",
  "message",
  "innerexception",
  "hresult",
  "data",
  "targetsite",
  "helplink",
];

export function isDuplicateExceptionName(name: string): boolean {
  return exceptionPropertyNames.includes(name.toLowerCase());
}

/** Gets all properties including inherited ones. */
export function getAllProperties(program: Program, model: Model): ModelProperty[] {
  const props: ModelProperty[] = [];
  let current: Model | undefined = model;
  while (current) {
    for (const prop of current.properties.values()) {
      props.push(prop);
    }
    current = current.baseModel;
  }
  return props;
}

/** Gets the status code for an error model. */
export function getErrorStatusCode(
  program: Program,
  model: Model,
): { value: string | number; requiresConstructorArgument?: boolean } | undefined {
  const allProps = getAllProperties(program, model);
  const statusCodeProp = allProps.find((p) => isStatusCode(program, p));
  if (!statusCodeProp) return undefined;

  const type = statusCodeProp.type;
  if (type.kind === "Union") {
    return { value: statusCodeProp.name, requiresConstructorArgument: true };
  }
  if (type.kind === "Number") {
    return { value: type.value };
  }
  // Fall back to @minValue decorator
  const minVal = getMinValue(program, statusCodeProp);
  return { value: minVal ?? "default" };
}

/** Gets a simple C# type name string for a TypeSpec type. */
export function getCSharpTypeString(program: Program, type: Type): string {
  if (type.kind === "Scalar") {
    const scalarMap: Record<string, string> = {
      string: "string",
      int8: "sbyte",
      int16: "short",
      int32: "int",
      int64: "long",
      uint8: "byte",
      uint16: "ushort",
      uint32: "uint",
      uint64: "ulong",
      float32: "float",
      float64: "double",
      boolean: "bool",
      plainDate: "DateOnly",
      plainTime: "TimeOnly",
      utcDateTime: "DateTimeOffset",
      offsetDateTime: "DateTimeOffset",
      duration: "TimeSpan",
      bytes: "byte[]",
      decimal: "decimal",
      decimal128: "decimal",
      url: "Uri",
      safeint: "long",
    };
    return scalarMap[type.name] ?? type.name;
  }
  if (type.kind === "String") return "string";
  if (type.kind === "Boolean") return "bool";
  if (type.kind === "Number") return Number.isInteger(type.value) ? "int" : "double";
  if (type.kind === "Enum") return type.name;
  if (type.kind === "Model") return type.name;
  return "object";
}

/** Gets the name to use when emitting a model — handles friendly names, template instantiations, and anonymous models. */
export function getModelEmitName(program: Program, model: Model): string {
  // Check for @friendlyName first
  const friendlyName = getFriendlyName(program, model);
  if (friendlyName) return friendlyName;

  // Anonymous models get sequential names
  if (!model.name || model.name === "") {
    return assignAnonymousName(model);
  }

  // For template instantiations, concatenate template args with the base name
  if (model.templateMapper && model.templateMapper.args.length > 0) {
    const argNames = model.templateMapper.args
      .filter((arg): arg is Type => arg.entityKind === "Type")
      .map((arg) => {
        if (arg.kind === "Model" || arg.kind === "Scalar") return arg.name;
        return undefined;
      })
      .filter(Boolean)
      .map((name) => name!.charAt(0).toUpperCase() + name!.slice(1));
    if (argNames.length > 0) {
      return `${model.name}${argNames.join("")}`;
    }
  }

  return model.name;
}
