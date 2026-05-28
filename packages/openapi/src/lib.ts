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
    "mixed-tag-metadata-form": {
      severity: "error",
      messages: {
        default: `Cannot mix the array form and the inline form of @tagMetadata on the same namespace. Use either @tagMetadata(#[...]) or multiple @tagMetadata("name", #{...}) calls, not both.`,
      },
    },
    "tag-metadata-array-with-metadata-arg": {
      severity: "error",
      messages: {
        default: `When using the array form of @tagMetadata, the second argument (tagMetadata) must not be provided. Include all tag metadata inside the array elements.`,
      },
    },
    "tag-metadata-target-service": {
      severity: "error",
      messages: {
        default: paramMessage`@tagMetadata must be used on the service namespace. Did you mean to annotate '${"namespace"}'  with '@service'?`,
      },
    },
    "default-response-with-status-code": {
      severity: "warning",
      messages: {
        statusCode: `@defaultResponse should not be used on a model that already has a status code defined. The status code will be ignored in favor of the default response.`,
        error: `@defaultResponse should not be used on a model that is marked with @error. Use either @defaultResponse or @error, not both.`,
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
