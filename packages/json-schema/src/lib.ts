import {
  createTypeSpecLibrary,
  definePackageFlags,
  type JSONSchemaType,
  paramMessage,
} from "@typespec/compiler";

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
}

/**
 * Internal: Json Schema emitter options schema
 */
export const EmitterOptionsSchema: JSONSchemaType<JSONSchemaEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "file-type": {
      type: "string",
      enum: ["yaml", "json"],
      nullable: true,
      description: "Serialize the schema as either yaml or json.",
    },
    "int64-strategy": {
      type: "string",
      enum: ["string", "number"],
      nullable: true,
      description: `How to handle 64 bit integers on the wire. Options are:

* string: serialize as a string (widely interoperable)
* number: serialize as a number (not widely interoperable)`,
    },
    bundleId: {
      type: "string",
      nullable: true,
      description:
        "When provided, bundle all the schemas into a single json schema document with schemas under $defs. The provided id is the id of the root document and is also used for the file name.",
    },
    emitAllModels: {
      type: "boolean",
      nullable: true,
      description:
        "When true, emit all model declarations to JSON Schema without requiring the @jsonSchema decorator.",
    },
    emitAllRefs: {
      type: "boolean",
      nullable: true,
      description:
        "When true, emit all references as json schema files, even if the referenced type does not have the `@jsonSchema` decorator or is not within a namespace with the `@jsonSchema` decorator.",
    },
    "seal-object-schemas": {
      type: "boolean",
      nullable: true,
      default: false,
      description: [
        "If true, then for models emitted as object schemas we default `unevaluatedProperties` to `{ not: {} }`,",
        "if not explicitly specified elsewhere.",
        "Default: `false`",
      ].join("\n"),
    },
  },
  required: [],
};

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
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<JSONSchemaEmitterOptions>,
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
