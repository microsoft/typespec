import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const libDef = {
  name: "@typespec/tspd",
  diagnostics: {
    "exports-missing": {
      severity: "error",
      messages: {
        default: `exports field is missing in package.json`,
        missingCondition: `exports field is missing one export with the typespec condition`,
      },
    },
    "documentation-missing": {
      severity: "warning",
      messages: {
        decorator: paramMessage`Missing documentation for decorator '${"name"}'.`,
        decoratorParam: paramMessage`Missing documentation for decorator parameter '${"name"}.${"param"}'.`,
        templateParam: paramMessage`Missing documentation for template parameter '${"name"}.${"param"}'.`,
        model: paramMessage`Missing documentation for model '${"name"}'.`,
        union: paramMessage`Missing documentation for union '${"name"}'.`,
        enum: paramMessage`Missing documentation for enum '${"name"}'.`,
        interface: paramMessage`Missing documentation for interface '${"name"}'.`,
        interfaceOperation: paramMessage`Missing documentation for interface operation '${"name"}'.`,
        operation: paramMessage`Missing documentation for operation '${"name"}'.`,
        scalar: paramMessage`Missing documentation for scalar '${"name"}'.`,
      },
    },
  },
} as const;

export const $lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic, createStateSymbol, createDiagnostic } = $lib;

export type RefDocLibrary = typeof $lib;
