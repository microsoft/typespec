import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "http-client-javascript",
  diagnostics: {
    "mixed-part-nonpart": {
      severity: "warning",
      messages: {
        default: "Mixed part and non-part properties in model",
      },
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
