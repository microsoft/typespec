import { createTypeSpecLibrary } from "@typespec/compiler";

export const libDef = {
  name: "@typespec/xml",
  diagnostics: {},
} as const;
export const { reportDiagnostic, createStateSymbol } = createTypeSpecLibrary(libDef);
