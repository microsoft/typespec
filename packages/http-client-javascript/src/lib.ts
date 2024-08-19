import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "http-client-javascript",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
