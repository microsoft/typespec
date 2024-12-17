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
    "unsupported-type": {
      severity: "error", // TODO: Warning for release and error for debug
      messages: {
        default: "Unsupported type, falling back to any",
      },
      description: "This type is not supported by the emitter",
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
