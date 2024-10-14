import {
  createTypeSpecLibrary,
  definePackageFlags,
  JSONSchemaType,
  paramMessage,
} from "@typespec/compiler";

export type FileType = "yaml" | "json";
export type Int64Strategy = "string" | "number";

export interface JSONSchemaEmitterOptions {
  /**
   * Serialize the schema as either yaml or json.
   * @default yaml, it not specified infer from the `output-file` extension
   */
  "file-type"?: FileType;

  /**
   * How to handle 64 bit integers on the wire. Options are:
   *
   * * string: serialize as a string (widely interoperable)
   * * number: serialize as a number (not widely interoperable)
   */
  "int64-strategy"?: Int64Strategy;

  /**
   * When provided, bundle all the schemas into a single json schema document
   * with schemas under $defs. The provided id is the id of the root document
   * and is also used for the file name.
   */
  bundleId?: string;

  /**
   * When true, emit all model declarations to JSON Schema without requiring
   * the @jsonSchema decorator.
   */
  emitAllModels?: boolean;

  /**
   * When true, emit all references as json schema files, even if the referenced
   * type does not have the `@jsonSchema` decorator or is not within a namespace
   * with the `@jsonSchema` decorator.
   */
  emitAllRefs?: boolean;
}

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
  },
  required: [],
};

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
} as const);

export const $flags = definePackageFlags({});

export const { reportDiagnostic, createStateSymbol } = $lib;

export type JsonSchemaLibrary = typeof $lib;
