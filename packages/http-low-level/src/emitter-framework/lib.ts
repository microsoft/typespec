import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "cadl-ts-interface-emitter",
  diagnostics: {
  }
} as const;
const lib = createCadlLibrary(libDef);
export const { reportDiagnostic } = lib;
export type Lib = typeof lib;
