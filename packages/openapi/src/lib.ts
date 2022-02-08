import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@cadl-lang/openapi",
  diagnostics: {
    "invalid-extension-key": {
      severity: "error",
      messages: {
        default: paramMessage`OpenAPI extension must start with 'x-' but was '${"value"}'`,
      },
    },
  },
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
