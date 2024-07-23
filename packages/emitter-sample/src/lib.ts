import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "emitter-sample",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
