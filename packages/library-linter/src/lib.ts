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
    "missing-signature": {
      severity: "warning",
      messages: {
        default: paramMessage`Decorator function $${"decName"} is missing a decorator declaration. Add "extern dec ${"decName"}(...args);" to the library tsp.`,
      },
    },
  },
} as const;
const lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic } = lib;

export type OpenAPILibrary = typeof lib;
