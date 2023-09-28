import { createTypeSpecLibrary, JSONSchemaType, paramMessage } from "@typespec/compiler";

export type FileType = "yaml" | "json";
export interface OpenAPI3EmitterOptions {
  /**
   * If the content should be serialized as YAML or JSON.
   * @default yaml, it not specified infer from the `output-file` extension
   */

  "file-type"?: FileType;

  /**
   * Name of the output file.
   * Output file will interpolate the following values:
   *  - service-name: Name of the service if multiple
   *  - version: Version of the service if multiple
   *
   * @default `{service-name}.{version}.openapi.yaml` or `.json` if {@link OpenAPI3EmitterOptions["file-type"]} is `"json"`
   *
   * @example Single service no versioning
   *  - `openapi.yaml`
   *
   * @example Multiple services no versioning
   *  - `openapi.Org1.Service1.yaml`
   *  - `openapi.Org1.Service2.yaml`
   *
   * @example Single service with versioning
   *  - `openapi.v1.yaml`
   *  - `openapi.v2.yaml`
   *
   * @example Multiple service with versioning
   *  - `openapi.Org1.Service1.v1.yaml`
   *  - `openapi.Org1.Service1.v2.yaml`
   *  - `openapi.Org1.Service2.v1.0.yaml`
   *  - `openapi.Org1.Service2.v1.1.yaml`
   */
  "output-file"?: string;

  /**
   * Set the newline character for emitting files.
   * @default lf
   */
  "new-line"?: "crlf" | "lf";

  /**
   * Omit unreachable types.
   * By default all types declared under the service namespace will be included. With this flag on only types references in an operation will be emitted.
   */
  "omit-unreachable-types"?: boolean;

  /**
   * If the generated openapi types should have the `x-typespec-name` extension set with the name of the TypeSpec type that created it.
   * This extension is meant for debugging and should not be depended on.
   * @default "never"
   */
  "include-x-typespec-name"?: "inline-only" | "never";
}

const EmitterOptionsSchema: JSONSchemaType<OpenAPI3EmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "file-type": {
      type: "string",
      enum: ["yaml", "json"],
      nullable: true,
      description:
        "If the content should be serialized as YAML or JSON. Default 'yaml', it not specified infer from the `output-file` extension",
    },
    "output-file": {
      type: "string",
      nullable: true,
      description: [
        "Name of the output file.",
        " Output file will interpolate the following values:",
        "  - service-name: Name of the service if multiple",
        "  - version: Version of the service if multiple",
        "",
        ' Default: `{service-name}.{version}.openapi.yaml` or `.json` if `file-type` is `"json"`',
        "",
        " Example Single service no versioning",
        "  - `openapi.yaml`",
        "",
        " Example Multiple services no versioning",
        "  - `openapi.Org1.Service1.yaml`",
        "  - `openapi.Org1.Service2.yaml`",
        "",
        " Example Single service with versioning",
        "  - `openapi.v1.yaml`",
        "  - `openapi.v2.yaml`",
        "",
        " Example Multiple service with versioning",
        "  - `openapi.Org1.Service1.v1.yaml`",
        "  - `openapi.Org1.Service1.v2.yaml`",
        "  - `openapi.Org1.Service2.v1.0.yaml`",
        "  - `openapi.Org1.Service2.v1.1.yaml`    ",
      ].join("\n"),
    },
    "new-line": {
      type: "string",
      enum: ["crlf", "lf"],
      default: "lf",
      nullable: true,
      description: "Set the newline character for emitting files.",
    },
    "omit-unreachable-types": {
      type: "boolean",
      nullable: true,
      description:
        "Omit unreachable types.\nBy default all types declared under the service namespace will be included. With this flag on only types references in an operation will be emitted.",
    },
    "include-x-typespec-name": {
      type: "string",
      enum: ["inline-only", "never"],
      nullable: true,
      default: "never",
      description:
        "If the generated openapi types should have the `x-typespec-name` extension set with the name of the TypeSpec type that created it.\nThis extension is meant for debugging and should not be depended on.",
    },
  },
  required: [],
};

export const libDef = {
  name: "@typespec/openapi3",
  diagnostics: {
    "oneof-union": {
      severity: "error",
      messages: {
        default:
          "@oneOf decorator can only be used on a union or a model property which type is a union.",
      },
    },
    "inconsistent-shared-route-request-visibility": {
      severity: "error",
      messages: {
        default: "All operations with `@sharedRoutes` must have the same `@requestVisibility`.",
      },
    },
    "invalid-server-variable": {
      severity: "error",
      messages: {
        default: paramMessage`Server variable '${"propName"}' must be assignable to 'string'. It must either be a string, enum of string or union of strings.`,
      },
    },
    "invalid-format": {
      severity: "warning",
      messages: {
        default: paramMessage`Collection format '${"value"}' is not supported in OpenAPI3 ${"paramType"} parameters. Defaulting to type 'string'.`,
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
    "empty-union": {
      severity: "error",
      messages: {
        default:
          "Empty unions are not supported for OpenAPI v3 - enums must have at least one value.",
      },
    },
    "empty-enum": {
      severity: "error",
      messages: {
        default:
          "Empty enums are not supported for OpenAPI v3 - enums must have at least one value.",
      },
    },
    "enum-unique-type": {
      severity: "error",
      messages: {
        default: "Enums are not supported unless all options are literals of the same type.",
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
    options: EmitterOptionsSchema as JSONSchemaType<OpenAPI3EmitterOptions>,
  },
} as const;

export const $lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic, createStateSymbol } = $lib;

export type OpenAPILibrary = typeof $lib;
