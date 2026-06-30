import { createTypeSpecLibrary, definePackageFlags, paramMessage } from "@typespec/compiler";

/**
 * File type
 */
export type FileType = "yaml" | "json";

/**
 * Strategy for handling the int64 type in the resulting json schema.
 * - string: As a string
 * - number: As a number (In JavaScript, int64 cannot be accurately represented as number)
 *
 */
export type Int64Strategy = "string" | "number";

/**
 * Strategy for handling models with the discriminator decorator.
 * - ignore: Emit as regular object schema (default)
 * - oneOf: Emit a oneOf schema with references to all derived models (closed union)
 * - anyOf: Emit an anyOf schema with references to all derived models (open union)
 */
export type PolymorphicModelsStrategy = "ignore" | "oneOf" | "anyOf";

/**
 * Json schema emitter options
 */
export type { EmitterOptions as JSONSchemaEmitterOptions } from "../generated-defs/emitter-options.js";

/** Internal: TypeSpec library definition */
export const $lib = createTypeSpecLibrary({
  name: "@typespec/json-schema",
  diagnostics: {
    "invalid-default": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid type '${"type"}' for a default value`,
      },
    },
    "duplicate-id": {
      severity: "error",
      messages: {
        default: paramMessage`There are multiple types with the same id "${"id"}".`,
      },
    },
    "unknown-scalar": {
      severity: "warning",
      messages: {
        default: paramMessage`Scalar '${"name"}' is not a known scalar type and doesn't extend a known scalar type.`,
      },
    },
  },
  state: {
    JsonSchema: { description: "State indexing types marked with @jsonSchema" },
    "JsonSchema.baseURI": { description: "Contains data configured with @baseUri decorator" },
    "JsonSchema.multipleOf": { description: "Contains data configured with @multipleOf decorator" },
    "JsonSchema.id": { description: "Contains data configured with @id decorator" },
    "JsonSchema.oneOf": { description: "Contains data configured with @oneOf decorator" },
    "JsonSchema.contains": { description: "Contains data configured with @contains decorator" },
    "JsonSchema.minContains": {
      description: "Contains data configured with @minContains decorator",
    },
    "JsonSchema.maxContains": {
      description: "Contains data configured with @maxContains decorator",
    },
    "JsonSchema.uniqueItems": {
      description: "Contains data configured with @uniqueItems decorator",
    },
    "JsonSchema.minProperties": {
      description: "Contains data configured with @minProperties decorator",
    },
    "JsonSchema.maxProperties": {
      description: "Contains data configured with @maxProperties decorator",
    },
    "JsonSchema.contentEncoding": {
      description: "Contains data configured with @contentEncoding decorator",
    },
    "JsonSchema.contentSchema": {
      description: "Contains data configured with @contentSchema decorator",
    },
    "JsonSchema.contentMediaType": {
      description: "Contains data configured with @contentMediaType decorator",
    },
    "JsonSchema.prefixItems": {
      description: "Contains data configured with @prefixItems decorator",
    },
    "JsonSchema.extension": { description: "Contains data configured with @extension decorator" },
  },
} as const);

/** Internal: TypeSpec flags */
export const $flags = definePackageFlags({
  experimentalEmitterOptions: true,
});

export const { reportDiagnostic, createStateSymbol, stateKeys: JsonSchemaStateKeys } = $lib;

export type JsonSchemaLibrary = typeof $lib;
