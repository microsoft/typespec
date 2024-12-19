import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "emitter-framework",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
