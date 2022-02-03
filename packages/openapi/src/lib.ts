import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@cadl-lang/openapi",
  diagnostics: {
    "decorator-wrong-type": {
      severity: "error",
      messages: {
        default: paramMessage`Cannot use @${"decorator"} on a ${"entityKind"}`,
      },
    },
    "extension-x": {
      severity: "error",
      messages: {
        default: paramMessage`OpenAPI extension must start with "x-" but was "${"value"}"`,
      },
    },
  },
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
