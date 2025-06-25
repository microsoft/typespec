import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/openapi",
  diagnostics: {
    "invalid-extension-key": {
      severity: "error",
      messages: {
        default: paramMessage`OpenAPI extension must start with 'x-' but was '${"value"}'`,
      },
    },
    "duplicate-type-name": {
      severity: "error",
      messages: {
        default: paramMessage`Duplicate type name: '${"value"}'. Check @friendlyName decorators and overlap with types in TypeSpec or service namespace.`,
        parameter: paramMessage`Duplicate parameter key: '${"value"}'. Check @friendlyName decorators and overlap with types in TypeSpec or service namespace.`,
      },
    },
    "not-url": {
      severity: "error",
      messages: {
        default: paramMessage`${"property"}: ${"value"} is not a valid URL.`,
      },
    },
    "duplicate-tag": {
      severity: "error",
      messages: {
        default: paramMessage`"Metadata for tag '${"tagName"}' was specified twice."`,
      },
    },
    "tag-metadata-target-service": {
      severity: "error",
      messages: {
        default: paramMessage`@tagMetadata must be used on the service namespace. Did you mean to annotate '${"namespace"}'  with '@service'?`,
      },
    },
  },
  state: {
    tagsMetadata: { description: "State for the @tagMetadata decorator." },
  },
});

export const {
  createDiagnostic,
  reportDiagnostic,
  createStateSymbol,
  stateKeys: OpenAPIKeys,
} = $lib;
