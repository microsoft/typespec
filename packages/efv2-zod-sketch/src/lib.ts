import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "efv2-zod-sketch",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
