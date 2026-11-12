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
    "sub-export-missing-js": {
      severity: "warning",
      messages: {
        default: paramMessage`Sub export "${"subpath"}" declares decorators or functions but has no JS export condition("import" or "default") in package.json. Skipping generation of the signature typecheck file.`,
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
        rule: paramMessage`Missing documentation for linter rule '${"name"}'.`,
        diagnostic: paramMessage`Missing documentation for diagnostic '${"name"}'.`,
      },
    },
  },
} as const;

/** TypeSpec library definition used to create and report tspd's documentation diagnostics. */
export const $lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic, createStateSymbol, createDiagnostic } = $lib;

/** Library contract carrying tspd's diagnostic codes and message parameter types. */
export type RefDocLibrary = typeof $lib;
