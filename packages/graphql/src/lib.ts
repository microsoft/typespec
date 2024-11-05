import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "graphql",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
