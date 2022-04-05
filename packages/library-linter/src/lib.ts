import { createCadlLibrary } from "@cadl-lang/compiler";

export const libDef = {
  name: "@cadl-lang/library-linter",
  diagnostics: {},
} as const;
const lib = createCadlLibrary(libDef);
export const { reportDiagnostic } = lib;

export type OpenAPILibrary = typeof lib;
