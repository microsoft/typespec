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
export interface JSONSchemaEmitterOptions {
  /**
   * Serialize the schema as either yaml or json.
   * @defaultValue yaml it not specified infer from the `output-file` extension
   */
  "file-type"?: FileType;

  /**
   * How to handle 64-bit integers on the wire. Options are:
   *
   * - string: Serialize as a string (widely interoperable)
   * - number: Serialize as a number (not widely interoperable)
   */
  "int64-strategy"?: Int64Strategy;

  /**
   * When provided, bundle all the schemas into a single JSON Schema document
   * with schemas under $defs. The provided id is the id of the root document
   * and is also used for the file name.
   */
  bundleId?: string;

  /**
   * When true, emit all model declarations to JSON Schema without requiring
   * the `@jsonSchema` decorator.
   */
  emitAllModels?: boolean;

  /**
   * When true, emit all references as JSON Schema files, even if the referenced
   * type does not have the `@jsonSchema` decorator or is not within a namespace
   * with the `@jsonSchema` decorator.
   */
  emitAllRefs?: boolean;

  /**
   * If true, then for models emitted as object schemas we default `unevaluatedProperties` to `{ not: {} }`,
   * if not explicitly specified elsewhere.
   * @defaultValue false
   */
  "seal-object-schemas"?: boolean;

  /**
   * Strategy for emitting models with the discriminator decorator.
   * - ignore: Emit as regular object schema (default)
   * - oneOf: Emit a oneOf schema with references to all derived models (closed union)
   * - anyOf: Emit an anyOf schema with references to all derived models (open union)
   * @defaultValue "ignore"
   */
  "polymorphic-models-strategy"?: PolymorphicModelsStrategy;
}

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
export const $flags = definePackageFlags({});

export const { reportDiagnostic, createStateSymbol, stateKeys: JsonSchemaStateKeys } = $lib;

export type JsonSchemaLibrary = typeof $lib;
