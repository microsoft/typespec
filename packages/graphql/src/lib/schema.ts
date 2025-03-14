import {
  type DecoratorContext,
  type DecoratorFunction,
  type Namespace,
  type Program,
  validateDecoratorUniqueOnNode,
} from "@typespec/compiler";

import { GraphQLKeys, NAMESPACE } from "../lib.js";
import { useStateMap } from "@typespec/compiler/utils";

// This will set the namespace for decorators implemented in this file
export const namespace = NAMESPACE;

export interface SchemaDetails {
  name?: string;
}

export interface Schema extends SchemaDetails {
  type: Namespace;
}

const [getSchema, setSchema, getSchemaMap] = useStateMap<Namespace, Schema>(GraphQLKeys.schema);

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
  options: SchemaDetails = {},
) => {
  validateDecoratorUniqueOnNode(context, target, $schema);
  addSchema(context.program, target, options);
};
