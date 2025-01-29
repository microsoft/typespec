import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "efv2-aspire-sketch",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
