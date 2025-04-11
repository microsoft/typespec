/**
 * This module implements a transform name policy for working with TypeScript type objects.
 * It provides functions to generate transport and application names based on the input types.
 * The module supports custom naming strategies via optional namer functions and ensures that
 * type objects have valid string names before transformation.
 */

import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import * as ef from "@typespec/emitter-framework";
import { kebabCase } from "change-case";
import { reportDiagnostic } from "../../lib.js";

/**
 * Returns the default transform name policy provided by the emitter framework.
 * This function simply delegates to the framework's naming policy.
 */
export function useTransformNamePolicy(): ef.TransformNamePolicy {
  return ef.useTransformNamePolicy();
}

/**
 * A type combining a framework type with a required 'name' property of type string.
 * This is used to enforce that the 'name' property is a string.
 */
export type WithStringName = Type & { name: string };

/**
 * A type combining a framework type with a 'name' property that can be either a string or symbol.
 * This type supports cases where the name might be defined as a symbol.
 */
export type WithName = Type & { name: string | symbol };

/**
 * An interface defining custom namers for transport and application names.
 * These functions allow developers to override the default naming behavior.
 */
export interface TransformNamers {
  /**
   * Custom function to generate a transport name from a type object.
   *
   * @param type - The type object to transform.
   * @param encoding - Optional encoding string to modify the naming transformation.
   * @returns The custom or default transformed transport name as a string.
   */
  transportNamer?: (type: WithName, encoding?: string) => string;

  /**
   * Custom function to generate an application name from a type object.
   *
   * @param type - The type object to transform.
   * @returns The custom or default transformed application name as a string.
   */
  applicationNamer?: (type: WithName) => string;
}

/**
 * Factory function to create a transform name policy implementation with custom or default name transformation logic.
 * It uses provided custom namers for transport and application names if available, otherwise falling back to defaults.
 *
 * @param namers - Optional object containing custom transport and application namers.
 * @returns An implementation of TransformNamePolicy with getTransportName and getApplicationName methods.
 */
export function createTransformNamePolicy(namers: TransformNamers = {}): ef.TransformNamePolicy {
  // Use custom namer or default naming strategy for transport names.
  const transportNamer = namers.transportNamer ?? defaultTransportNameGetter;
  // Use custom namer or default naming strategy for application names.
  const applicationNamer = namers.applicationNamer ?? defaultApplicationNameGetter;

  return {
    /**
     * Generates a transport name from the given type using the appropriate namer.
     * Reports a diagnostic error if the type does not have a valid string name.
     *
     * @param type - Type object that must have a 'name' property.
     * @returns The transformed transport name as a string.
     */
    getTransportName(type) {
      return transportNamer(type);
    },

    /**
     * Generates an application name from the given type using the appropriate namer.
     * Reports a diagnostic error if the type does not have a valid string name.
     *
     * @param type - Type object that must have a 'name' property.
     * @returns The transformed application name as a string.
     */
    getApplicationName(type) {
      return applicationNamer(type);
    },
  };
}

/**
 * Default naming function for application names.
 * It uses a TypeScript naming policy to transform the type's name.
 *
 * @param type - The type object whose name is to be transformed.
 * @returns The transformed application name as a string.
 */
export function defaultApplicationNameGetter(type: WithName): string {
  // Ensure the type's name is a string before proceeding.
  if (!hasStringName(type)) {
    // Report a diagnostic if a symbol is used which isn't supported.
    reportDiagnostic($.program, { code: "symbol-name-not-supported", target: type });
    return "";
  }

  // Retrieve the TypeScript name policy to handle naming conventions.
  const namePolicy = ts.useTSNamePolicy();
  const name = type.name;
  return namePolicy.getName(name, "object-member-data");
}

/**
 * Default naming function for transport names.
 * This function optionally applies an encoding to the type's name and modifies header names to kebab-case.
 *
 * @param type - The type object whose name is to be transformed.
 * @param encoding - Optional encoding for the name, defaulting to "application/json".
 * @returns The transformed transport name as a string.
 */
export function defaultTransportNameGetter(
  type: WithName,
  encoding: string = "application/json",
): string {
  // Ensure the type's name is a string to allow for safe transformation.
  if (!hasStringName(type)) {
    // Report a diagnostic for unsupported symbol names.
    reportDiagnostic($.program, { code: "symbol-name-not-supported", target: type });
    return "";
  }
  // Retrieve the encoded name if encoding is provided, otherwise use the original name.
  let name = encoding ? $.type.getEncodedName(type, encoding) : type.name;

  // For model properties that represent HTTP headers, convert the name to kebab-case.
  if ($.modelProperty.is(type) && $.modelProperty.isHttpHeader(type)) {
    name = kebabCase(name);
  }
  return name;
}

/**
 * Helper function to check whether a type's name is a string.
 * This is used to enforce our assumption that name transformations require a string.
 *
 * @param type - The type object containing a 'name' property.
 * @returns True if the type's name is a string; otherwise, false.
 */
export function hasStringName(type: WithName): type is WithStringName {
  return typeof type.name === "string";
}
