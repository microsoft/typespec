import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/graphql",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
