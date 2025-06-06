import { createTypeSpecLibrary, JSONSchemaType, paramMessage } from "@typespec/compiler";

export type FileType = "yaml" | "json";
export type OpenAPIVersion = "3.0.0" | "3.1.0";
export type ExperimentalParameterExamplesStrategy = "data" | "serialized";
export interface OpenAPI3EmitterOptions {
  /**
   * If the content should be serialized as YAML or JSON.
   * @default yaml, it not specified infer from the `output-file` extension
   */

  "file-type"?: FileType;

  /**
   * Name of the output file.
   * Output file will interpolate the following values:
   *  - service-name: Name of the service
   *  - service-name-if-multiple: Name of the service if multiple
   *  - version: Version of the service if multiple
   *
   * @default `{service-name-if-multiple}.{version}.openapi.yaml` or `.json` if {@link OpenAPI3EmitterOptions["file-type"]} is `"json"`
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
   * The Open API specification versions to emit.
   * If more than one version is specified, then the output file
   * will be created inside a directory matching each specification version.
   *
   * @default ["v3.0"]
   * @internal
   */
  "openapi-versions"?: OpenAPIVersion[];

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

  /**
   * How to handle safeint type. Options are:
   *  - `double-int`: Will produce `type: integer, format: double-int`
   *  - `int64`: Will produce `type: integer, format: int64`
   * @default "int64"
   */
  "safeint-strategy"?: "double-int" | "int64";

  /**
   * If true, then for models emitted as object schemas we default `additionalProperties` to false for
   * OpenAPI 3.0, and `unevaluatedProperties` to false for OpenAPI 3.1, if not explicitly specified elsewhere.
   * @default false
   */
  "seal-object-schemas"?: boolean;

  /**
   * Determines how to emit examples on parameters.
   *
   * Note: This is an experimental feature and may change in future versions.
   * @see https://spec.openapis.org/oas/v3.0.4.html#style-examples for parameter example serialization rules.
   * @see https://github.com/OAI/OpenAPI-Specification/discussions/4622 for discussion on handling parameter examples.
   */
  "experimental-parameter-examples"?: ExperimentalParameterExamplesStrategy;
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
        "  - service-name: Name of the service",
        "  - service-name-if-multiple: Name of the service if multiple",
        "  - version: Version of the service if multiple",
        "",
        ' Default: `{service-name-if-multiple}.{version}.openapi.yaml` or `.json` if `file-type` is `"json"`',
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
    "openapi-versions": {
      type: "array",
      items: {
        type: "string",
        enum: ["3.0.0", "3.1.0"],
        nullable: true,
        description: "The versions of OpenAPI to emit. Defaults to `[3.0.0]`",
      },
      nullable: true,
      uniqueItems: true,
      minItems: 1,
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
    "safeint-strategy": {
      type: "string",
      enum: ["double-int", "int64"],
      nullable: true,
      default: "int64",
      description: [
        "How to handle safeint type. Options are:",
        " - `double-int`: Will produce `type: integer, format: double-int`",
        " - `int64`: Will produce `type: integer, format: int64`",
        "",
        "Default: `int64`",
      ].join("\n"),
    },
    "seal-object-schemas": {
      type: "boolean",
      nullable: true,
      default: false,
      description: [
        "If true, then for models emitted as object schemas we default `additionalProperties` to false for",
        "OpenAPI 3.0, and `unevaluatedProperties` to false for OpenAPI 3.1, if not explicitly specified elsewhere.",
        "Default: `false`",
      ].join("\n"),
    },
    "experimental-parameter-examples": {
      type: "string",
      enum: ["data", "serialized"],
      nullable: true,
      description: [
        "Determines how to emit examples on parameters.",
        "Note: This is an experimental feature and may change in future versions.",
        "See https://spec.openapis.org/oas/v3.0.4.html#style-examples for parameter example serialization rules",
        "See https://github.com/OAI/OpenAPI-Specification/discussions/4622 for discussion on handling parameter examples.",
      ].join("\n"),
    },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@typespec/openapi3",
  capabilities: {
    dryRun: true,
  },
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
    "invalid-style": {
      severity: "warning",
      messages: {
        default: paramMessage`Style '${"style"}' is not supported in OpenAPI3 ${"paramType"} parameters. Defaulting to style 'simple'.`,
        optionalPath: paramMessage`Style '${"style"}' is not supported in OpenAPI3 ${"paramType"} parameters. The style ${"style"} could be introduced by an optional parameter. Defaulting to style 'simple'.`,
      },
    },
    "path-reserved-expansion": {
      severity: "warning",
      messages: {
        default: `Reserved expansion of path parameter with '+' operator #{allowReserved: true} is not supported in OpenAPI3.`,
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
    "inline-cycle": {
      severity: "error",
      messages: {
        default: paramMessage`Cycle detected in '${"type"}'. Use @friendlyName decorator to assign an OpenAPI definition name and make it non-inline.`,
      },
    },
    "unsupported-status-code-range": {
      severity: "error",
      messages: {
        default: paramMessage`Status code range '${"start"} to '${"end"}' is not supported. OpenAPI 3.0 can only represent range 1XX, 2XX, 3XX, 4XX and 5XX. Example: \`@minValue(400) @maxValue(499)\` for 4XX.`,
      },
    },
    "invalid-model-property": {
      severity: "error",
      messages: {
        default: paramMessage`'${"type"}' cannot be specified as a model property.`,
      },
    },
    "unsupported-auth": {
      severity: "warning",
      messages: {
        default: paramMessage`Authentication "${"authType"}" is not a known authentication by the openapi3 emitter, it will be ignored.`,
      },
    },
    "xml-attribute-invalid-property-type": {
      severity: "warning",
      messages: {
        default: paramMessage`XML \`@attribute\` can only be primitive types in the OpenAPI 3 emitter, Property '${"name"}' type will be changed to type: string.`,
      },
    },
    "xml-unwrapped-invalid-property-type": {
      severity: "warning",
      messages: {
        default: paramMessage`XML \`@unwrapped\` can only used on array properties or primitive ones in the OpenAPI 3 emitter, Property '${"name"}' will be ignored.`,
      },
    },
    "invalid-component-fixed-field-key": {
      severity: "warning",
      messages: {
        default: paramMessage`Invalid key '${"value"}' used in a fixed field of the Component object. Only alphanumerics, dot (.), hyphen (-), and underscore (_) characters are allowed in keys.`,
      },
    },
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<OpenAPI3EmitterOptions>,
  },
});
export const { createDiagnostic, reportDiagnostic, createStateSymbol } = $lib;

export type OpenAPILibrary = typeof $lib;
