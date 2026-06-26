import { createTypeSpecLibrary, definePackageFlags, paramMessage } from "@typespec/compiler";

export type FileType = "yaml" | "json";
export type OpenAPIVersion = "3.0.0" | "3.1.0" | "3.2.0";
export type ExperimentalParameterExamplesStrategy = "data" | "serialized";
export type EnumStrategy = "default" | "annotated";
export type OperationIdStrategy = "parent-container" | "fqn" | "explicit-only";
export type { EmitterOptions as OpenAPI3EmitterOptions } from "../generated-defs/emitter-options.js";

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
    "streams-not-supported": {
      severity: "warning",
      messages: {
        default:
          "Streams with itemSchema are only fully supported in OpenAPI 3.2.0 or above. The response will be emitted without itemSchema. Consider using OpenAPI 3.2.0 for full stream support.",
      },
    },
    "default-not-supported": {
      severity: "warning",
      messages: {
        default: paramMessage`Default value is not supported in OpenAPI 3.0 ${"message"}`,
      },
    },
    "enum-strategy-not-supported": {
      severity: "warning",
      messages: {
        default:
          "`enum-strategy: annotated` is only supported for OpenAPI 3.1.0 and above. The default enum strategy will be used for OpenAPI 3.0.0.",
      },
    },
  },
});
export const { createDiagnostic, reportDiagnostic, createStateSymbol } = $lib;

/** Internal: TypeSpec flags */
export const $flags = definePackageFlags({
  experimentalEmitterOptions: true,
});

export type OpenAPILibrary = typeof $lib;
