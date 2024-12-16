import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "emitter-framework/typescript",
  diagnostics: {
    "unsupported-scalar": {
      severity: "warning",
      messages: {
        default: "Unsupported scalar type, falling back to any",
      },
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
