import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const libDef = {
  name: "@typespec/library-linter",
  diagnostics: {
    "missing-namespace": {
      severity: "warning",
      messages: {
        default: paramMessage`${"type"} '${"name"}' is not in a namespace. This is bad practice for a published library.`,
      },
    },
  },
} as const;
const lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic } = lib;

export type OpenAPILibrary = typeof lib;
