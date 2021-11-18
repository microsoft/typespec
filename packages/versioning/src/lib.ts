import { createCadlLibrary } from "@cadl-lang/compiler";

const libDef = {
  name: "@cadl-lang/openapi3",
  diagnostics: {},
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
