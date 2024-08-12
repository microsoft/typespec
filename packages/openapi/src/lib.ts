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
  },
});

export const { reportDiagnostic, createStateSymbol } = $lib;
