import { StringValue, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";

/**
 * Create a StringValue from a string value. Used for `.defaultValue` in ModelProperty
 *
 * @param value Value that will be used to create a StringValue
 * @returns
 */
export function getStringValue(value: string): StringValue {
  return {
    value: value,
    type: $.literal.create(value),
    valueKind: "StringValue",
    entityKind: "Value",
    scalar: undefined,
  } as StringValue;
}

/**
 * Get all of the unique types in a list of types. Filters out the duplicates and returns the resultant list of unique types.
 * @param types
 */
export function getUniqueTypes(types: Type[]): Type[] {
  if (types.length === 1) {
    return types;
  }
  // we're going to keep it more simple right now. We're assuming it can be either literals or strings

  // Filter out the string scalar types
  const stringScalarTypes = types.filter((t) => t.kind === "Scalar" && t.name === "string");

  // Ensure only one string scalar type is included
  const uniqueStringScalarType = stringScalarTypes.length > 0 ? [$.builtin.string] : [];

  // Filter out the string scalar types from the original list of types. Assume these are all literals
  const literalScaleTypes = types.filter((t) => !(t.kind === "Scalar" && t.name === "string"));

  // Combine the unique string scalar type with the list of literals
  return [...uniqueStringScalarType, ...literalScaleTypes];
}
