import * as py from "@alloy-js/python";
import type { Type } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework";
import { reportDiagnostic } from "../../lib.js";

export function useTransformNamePolicy(): ef.TransformNamePolicy {
  return ef.useTransformNamePolicy();
}

export type WithStringName = Type & { name: string };
export type WithName = Type & { name: string | symbol };

export interface TransformNamers {
  transportNamer?: (type: WithName, encoding?: string) => string;
  applicationNamer?: (type: WithName) => string;
}

/**
 * Factory function to create a Python-flavored `TransformNamePolicy` implementation.
 *
 * - Transport names default to the type's TypeSpec `name` (optionally adjusted by
 *   `@encodedName(...)`), since transport names go on the wire and shouldn't be
 *   transformed by language convention.
 * - Application names are run through `usePythonNamePolicy()` so they end up as
 *   snake_case for properties/parameters/functions and PascalCase for classes.
 */
export function createTransformNamePolicy(namers: TransformNamers = {}): ef.TransformNamePolicy {
  const transportNamer = namers.transportNamer ?? defaultTransportNameGetter;
  const applicationNamer = namers.applicationNamer ?? defaultApplicationNameGetter;

  return {
    getTransportName(type) {
      return transportNamer(type);
    },
    getApplicationName(type) {
      return applicationNamer(type);
    },
  };
}

export function defaultApplicationNameGetter(type: WithName): string {
  const { $ } = ef.useTsp();
  if (!hasStringName(type)) {
    reportDiagnostic($.program, { code: "symbol-name-not-supported", target: type });
    return "";
  }

  const namePolicy = py.usePythonNamePolicy();
  const elementName = getPythonElementName(type);
  return namePolicy.getName(type.name, elementName);
}

export function defaultTransportNameGetter(
  type: WithName,
  encoding: string = "application/json",
): string {
  const { $ } = ef.useTsp();
  if (!hasStringName(type)) {
    reportDiagnostic($.program, { code: "symbol-name-not-supported", target: type });
    return "";
  }
  return encoding ? $.type.getEncodedName(type, encoding) : type.name;
}

export function hasStringName(type: WithName): type is WithStringName {
  return typeof type.name === "string";
}

/**
 * Maps a TypeSpec `Type.kind` onto the closest `@alloy-js/python` element kind so
 * the Python name policy applies the right case convention.
 */
function getPythonElementName(type: WithName): py.PythonElements {
  switch (type.kind) {
    case "Model":
    case "Interface":
    case "Enum":
    case "Union":
    case "Scalar":
      return "class";
    case "EnumMember":
    case "UnionVariant":
      return "constant";
    case "Operation":
      return "function";
    case "ModelProperty":
      return "variable";
    default:
      return "variable";
  }
}
