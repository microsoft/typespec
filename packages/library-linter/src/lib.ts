import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@cadl-lang/library-linter",
  diagnostics: {
    "no-namespace": {
      severity: "warning",
      messages: {
        default: paramMessage`${"type"} '${"name"}' is not in a namespace. This is bad practice for a published library.`,
      },
    },
  },
} as const;
const lib = createCadlLibrary(libDef);
export const { reportDiagnostic } = lib;

export type OpenAPILibrary = typeof lib;
