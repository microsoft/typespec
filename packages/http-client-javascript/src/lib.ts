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
    "operation-not-in-client": {
      severity: "error",
      messages: {
        default: "Tried to get a client from an operation that is not in a client",
      },
    },
    "non-model-parts": {
      severity: "error",
      messages: {
        default: "Non-model parts are not supported",
      },
      description: "Non-model parts are not supported",
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
