import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "emitter-framework",
  diagnostics: {
    "type-declaration-missing-name": {
      messages: {
        default: "Can't declare a type without a name",
      },
      severity: "error",
      description: "A type declaration must have a name",
    },
    "csharp-unsupported-scalar": {
      severity: "warning",
      messages: {
        default: "Unsupported scalar type, falling back to object",
      },
      description: "This scalar has no C# equivalent",
    },
    "csharp-unsupported-type": {
      severity: "warning",
      messages: {
        default: "Unsupported type, falling back to object",
      },
      description: "This type has no C# equivalent",
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
