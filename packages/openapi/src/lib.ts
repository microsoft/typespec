import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@cadl-lang/openapi3",
  diagnostics: {
    "decorator-wrong-type": {
      severity: "error",
      messages: {
        default: paramMessage`Cannot use @${"decorator"} on a ${"entityKind"}`,
        modelsOperations: paramMessage`${"decoratorName"} decorator can only be applied to models and operation parameters.`,
      },
    },
  },
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
