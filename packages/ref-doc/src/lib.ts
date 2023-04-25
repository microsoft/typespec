import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const libDef = {
  name: "@typespec/ref-doc",
  diagnostics: {
    "documentation-missing": {
      severity: "warning",
      messages: {
        default: "Missing documentation.",
        decorator: paramMessage`Missing documentation for decorator '${"name"}'.`,
        decoratorParam: paramMessage`Missing documentation for decorator parameter '${"name"}.${"param"}'.`,
      },
    },
  },
} as const;

export const $lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic, createStateSymbol } = $lib;

export type RefDocLibrary = typeof $lib;
