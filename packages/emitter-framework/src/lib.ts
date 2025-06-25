import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "emitter-framework",
  diagnostics: {
    "type-declaration-missing-name": {
      messages: {
        default: "Can't declare a type without a name",
      },
      severity: "error",
      description: "A type declaration must have a name",
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
