import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-javascript",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
