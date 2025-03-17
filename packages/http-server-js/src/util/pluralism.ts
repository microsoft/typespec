// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

/**
 * Provides an alternative name for anonymous TypeSpec.Array elements.
 * @param typeName
 * @returns
 */
export function getArrayElementName(typeName: string): string {
  return typeName + "Element";
}

/**
 * Provides an alternative name for anonymous TypeSpec.Record values.
 * @param typeName
 * @returns
 */
export function getRecordValueName(typeName: string): string {
  return typeName + "Value";
}

/**
 * Produces the name of an array type for a given base type.
 *
 * If the type name is a simple identifier, this will use the `[]` syntax,
 * otherwise it will use the `Array<>` type constructor.
 *
 * @param typeName - the base type to make an array of
 * @returns a good representation of an array of the base type
 */
export function asArrayType(typeName: string): string {
  if (/^[a-zA-Z_]+$/.test(typeName)) {
    return typeName + "[]";
  } else {
    return `Array<${typeName}>`;
  }
}
