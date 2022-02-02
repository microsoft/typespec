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
  },
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
