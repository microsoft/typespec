import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import * as ef from "@typespec/emitter-framework";
import { kebabCase } from "change-case";
import { reportDiagnostic } from "../../lib.js";

export function useTransformNamePolicy(): ef.TransformNamePolicy {
  return ef.useTransformNamePolicy();
}

/**
 * A type that extends `Type` and includes a `name` property of type `string`.
 * This type is used to represent objects that specifically have a `name` property of type `string`.
 */
export type WithStringName = Type & { name: string };

/**
 * A type that extends `Type` and includes a `name` property of type `string | symbol`.
 * This type is used to represent objects that have a `name` property which can either be a `string` or `symbol`.
 */
export type WithName = Type & { name: string | symbol };

/**
 * A set of optional namers that can be provided for transforming transport and application names.
 * The `transportNamer` transforms the transport name, while `applicationNamer` transforms the application name.
 */
export interface TransformNamers {
  /**
   * Function to generate a transport name from a `Type` object.
   *
   * @param type - The type object to transform.
   * @param encoding - An optional encoding string to modify the transformation.
   * @returns A transformed transport name as a string.
   */
  transportNamer?: (type: WithName, encoding?: string) => string;

  /**
   * Function to generate an application name from a `Type` object.
   *
   * @param type - The type object to transform.
   * @returns A transformed application name as a string.
   */
  applicationNamer?: (type: WithName) => string;
}

/**
 * Factory function to create a `TransformNamePolicy` implementation with custom or default name transformation logic.
 * This function uses the provided namers for transport and application names. If no namers are provided,
 * default implementations are used.
 *
 * @param namers - An optional object containing custom `transportNamer` and `applicationNamer` functions.
 * @returns A `TransformNamePolicy` implementation.
 */
export function createTransformNamePolicy(namers: TransformNamers = {}): ef.TransformNamePolicy {
  const transportNamer = namers.transportNamer ?? defaultTransportNameGetter;
  const applicationNamer = namers.applicationNamer ?? defaultApplicationNameGetter;

  return {
    /**
     * Transforms the transport name based on the provided `transportNamer` function or the default.
     * If the `type` does not have a string `name`, it reports a diagnostic.
     *
     * @param type - The object that has a `name` property (either string or symbol).
     * @returns The transformed transport name as a string.
     */
    getTransportName(type) {
      return transportNamer(type);
    },

    /**
     * Transforms the application name based on the provided `applicationNamer` function or the default.
     * If the `type` does not have a string `name`, it reports a diagnostic.
     *
     * @param type - The object that has a `name` property (either string or symbol).
     * @returns The transformed application name as a string.
     */
    getApplicationName(type) {
      return applicationNamer(type);
    },
  };
}

/**
 * Default function for transforming the application name. It assumes that the `type` has a `name` of type `string`.
 *
 * @param type - The type object that must have a `name` property of type `string`.
 * @returns The transformed application name as a string.
 */
export function defaultApplicationNameGetter(type: WithName): string {
  if (!hasStringName(type)) {
    reportDiagnostic($.program, { code: "symbol-name-not-supported", target: type });
    return "";
  }

  const namePolicy = ts.useTSNamePolicy();
  const name = type.name;
  return namePolicy.getName(name, "object-member-data");
}

/**
 * Default function for transforming the transport name. It assumes that the `type` has a `name` of type `string`.
 * Optionally uses an `encoding` string to modify the name.
 *
 * @param type - The type object that must have a `name` property of type `string`.
 * @param encoding - Optional encoding for the transport name.
 * @returns The transformed transport name as a string.
 */
export function defaultTransportNameGetter(
  type: WithName,
  encoding: string = "application/json",
): string {
  if (!hasStringName(type)) {
    reportDiagnostic($.program, { code: "symbol-name-not-supported", target: type });
    return "";
  }
  let name = encoding ? $.type.getEncodedName(type, encoding) : type.name;

  if ($.modelProperty.is(type) && $.modelProperty.isHttpHeader(type)) {
    name = kebabCase(name);
  }
  return name;
}

/**
 * Helper function to check if the provided `type` has a `name` property of type `string`.
 *
 * @param type - The type object that may have a `name` property of type `string` or `symbol`.
 * @returns A boolean indicating whether the `name` property is a string.
 */
export function hasStringName(type: WithName): type is WithStringName {
  return typeof type.name === "string";
}
