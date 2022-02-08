import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@cadl-lang/openapi3",
  diagnostics: {
    "security-service-namespace": {
      severity: "error",
      messages: {
        default: "Cannot add security details to a namespace other than the service namespace.",
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
    "duplicate-response": {
      severity: "error",
      messages: {
        default: paramMessage`Multiple return types for status code ${"statusCode"}`,
      },
    },
    "content-type-ignored": {
      severity: "warning",
      messages: {
        default: "content-type header ignored because return type has no body",
      },
    },
    "content-type-string": {
      severity: "error",
      messages: {
        default: "contentType parameter must be a string literal or union of string literals",
      },
    },
    "status-code-invalid": {
      severity: "error",
      messages: {
        default:
          "status-code header must be a numeric or string literal or union of numeric or string literals",
        value: "status-code value must be a specific code between 100 and 599, or nXX, or default",
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
  },
  emitter: {
    names: ["openapi3"],
  },
} as const;
const lib = createCadlLibrary(libDef);
export const { reportDiagnostic } = lib;

export type OpenAPILibrary = typeof lib;
