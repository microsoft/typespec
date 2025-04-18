/**
 * This file provides a utility function for obtaining the JSON transport name for a given type.
 * This comes from annotating typespec types with @encodedName
 * It is part of the JSON transformation module used in the Typespec compiler.
 *
 * The function getJsonTransportName determines the encoded JSON name for a type, if available,
 * and reports a diagnostic error if the type does not have a name.
 */

import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { reportDiagnostic } from "../../../../lib.js";

/**
 * Retrieves the JSON transport name for a given type.
 *
 * @param type The type for which to get the JSON transport name.
 * @returns {string} The encoded JSON name if provided by the typekit, otherwise the type's default name.
 *
 * The function checks if the provided type has a 'name' property.
 * If the type lacks a 'name', it reports a diagnostic error and returns an empty string.
 * Otherwise, it attempts to get an encoded name for the JSON transport using the experimental typekit.
 * If no encoded name is found, it returns the default type name.
 */
export function getJsonTransportName(type: Type) {
  // Check if the 'type' object has a 'name' property.
  if (!("name" in type)) {
    // Report an error diagnostic if the type does not have a name.
    reportDiagnostic($.program, { code: "no-name-type", target: type });
    return "";
  }

  // Attempt to retrieve an encoded JSON transport name using the experimental typekit.
  // If no encoded name is available, fallback to the default name from the type.
  return $.type.getEncodedName(type as any, "json") ?? type.name;
}
