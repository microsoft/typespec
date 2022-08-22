import { createCadlLibrary, JSONSchemaType, paramMessage } from "@cadl-lang/compiler";

export interface OpenAPI3EmitterOptions {
  "output-file"?: string;

  /**
   * Set the newline character for emitting files.
   * @default lf
   */
  "new-line"?: "crlf" | "lf";
}

const EmiterOptionsSchema: JSONSchemaType<OpenAPI3EmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "output-file": { type: "string", nullable: true },
    "new-line": { type: "string", enum: ["crlf", "lf"], nullable: true },
  },
  required: [],
};

export const libDef = {
  name: "@cadl-lang/openapi3",
  diagnostics: {
    "invalid-server-variable": {
      severity: "error",
      messages: {
        default: paramMessage`Server variable '${"propName"}' must be assignable to 'string'. It must either be a string, enum of string or union of strings.`,
      },
    },
    "resource-namespace": {
      severity: "error",
      messages: {
        default: "Resource goes on namespace",
      },
    },
    "path-query": {
      severity: "error",
      messages: {
        default: `OpenAPI does not allow paths containing a query string.`,
      },
    },
    "duplicate-body": {
      severity: "error",
      messages: {
        default: "Duplicate @body declarations on response type",
      },
    },
    "duplicate-header": {
      severity: "error",
      messages: {
        default: paramMessage`The header ${"header"} is defined across multiple content types`,
      },
    },
    "status-code-in-default-response": {
      severity: "error",
      messages: {
        default: "a default response should not have an explicit status code",
      },
    },
    "invalid-schema": {
      severity: "error",
      messages: {
        default: paramMessage`Couldn't get schema for type ${"type"}`,
      },
    },
    "union-null": {
      severity: "error",
      messages: {
        default: "Cannot have a union containing only null types.",
      },
    },
    "union-unsupported": {
      severity: "error",
      messages: {
        default: "Unions are not supported unless all options are literals of the same type.",
        type: paramMessage`Type "${"kind"}" cannot be used in unions`,
        empty:
          "Empty unions are not supported for OpenAPI v3 - enums must have at least one value.",
        null: "Unions containing multiple model types cannot be emitted to OpenAPI v2 unless the union is between one model type and 'null'.",
      },
    },
    discriminator: {
      severity: "error",
      messages: {
        duplicate: paramMessage`Discriminator value "${"val"}" defined in two different variants: ${"model1"} and ${"model2"}`,
        missing: "The discriminator property is not defined in a variant of a discriminated union.",
        required: "The discriminator property must be a required property.",
        type: "The discriminator property must be type 'string'.",
      },
    },
    "discriminator-value": {
      severity: "warning",
      messages: {
        literal:
          "Each variant of a discriminated union should define the discriminator property with a string literal value.",
      },
    },
    "invalid-default": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid type '${"type"}' for a default value`,
      },
    },
    "inline-cycle": {
      severity: "error",
      messages: {
        default: paramMessage`Cycle detected in '${"type"}'. Use @friendlyName decorator to assign an OpenAPI definition name and make it non-inline.`,
      },
    },
  },
  emitter: {
    options: EmiterOptionsSchema as JSONSchemaType<OpenAPI3EmitterOptions>,
  },
} as const;

export const $lib = createCadlLibrary(libDef);
export const { reportDiagnostic, createStateSymbol } = $lib;

export type OpenAPILibrary = typeof $lib;
