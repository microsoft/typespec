import {
  type DecoratorContext,
  type DecoratorFunction,
  type Namespace,
  type Program,
  type Type,
  getTypeName,
  validateDecoratorUniqueOnNode,
} from "@typespec/compiler";

import { createStateSymbol, NAMESPACE, reportDiagnostic } from "../lib.js";
import { useStateMap } from "./state-map.js";

// This will set the namespace for decorators implemented in this file
export const namespace = NAMESPACE;

export interface SchemaDetails {
  name?: string;
}

export interface Schema extends SchemaDetails {
  type: Namespace;
}

const [getSchema, setSchema, getSchemaMap] = useStateMap<Namespace, Schema>(
  createStateSymbol("schemas"),
);

/**
 * List all the schemas defined in the TypeSpec program
 * @param program Program
 * @returns List of schemas.
 */
export function listSchemas(program: Program): Schema[] {
  return [...getSchemaMap(program).values()];
}

export {
  /**
   * Get the schema information for the given namespace.
   * @param program Program
   * @param namespace Schema namespace
   * @returns Schema information or undefined if namespace is not a schema namespace.
   */
  getSchema,
};

/**
 * Check if the namespace is defined as a schema.
 * @param program Program
 * @param namespace Namespace
 * @returns Boolean
 */
export function isSchema(program: Program, namespace: Namespace): boolean {
  return getSchemaMap(program).has(namespace);
}

/**
 * Mark the given namespace as a schema.
 * @param program Program
 * @param namespace Namespace
 * @param details Schema details
 */
export function addSchema(
  program: Program,
  namespace: Namespace,
  details: SchemaDetails = {},
): void {
  const schemaMap = getSchemaMap(program);
  const existing = schemaMap.get(namespace) ?? {};
  setSchema(program, namespace, { ...existing, ...details, type: namespace });
}

export const $schema: DecoratorFunction = (
  context: DecoratorContext,
  target: Namespace,
  options: Type,
) => {
  validateDecoratorUniqueOnNode(context, target, $schema);

  if (options && options.kind !== "Model") {
    reportDiagnostic(context.program, {
      code: "invalid-argument",
      format: { value: options.kind, expected: "Model" },
      target: context.getArgumentTarget(0)!,
    });
    return;
  }

  const schemaDetails: SchemaDetails = {};
  const name = options?.properties.get("name")?.type;
  if (name) {
    if (name.kind === "String") {
      schemaDetails.name = name.value;
    } else {
      reportDiagnostic(context.program, {
        code: "unassignable",
        format: { sourceType: getTypeName(name), targetType: "String" },
        target: context.getArgumentTarget(0)!,
      });
    }
  }

  addSchema(context.program, target, schemaDetails);
};
