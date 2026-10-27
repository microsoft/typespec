import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $csharpLib = createTypeSpecLibrary({
  name: "emitter-framework",
  diagnostics: {
    "csharp-unsupported-scalar": {
      severity: "warning",
      messages: {
        default: paramMessage`Scalar '${"typeName"}' has no C# equivalent, using 'object' instead. Extend a built-in scalar to control how it is emitted.`,
      },
      description: "This scalar has no C# equivalent",
    },
    "csharp-unsupported-type": {
      severity: "warning",
      messages: {
        default: paramMessage`Type '${"typeName"}' of kind '${"kind"}' is not supported in C#, using 'object' instead.`,
      },
      description: "This type has no C# equivalent",
    },
  },
});

export const {
  reportDiagnostic: reportCsharpDiagnostic,
  createDiagnostic: createCsharpDiagnostic,
} = $csharpLib;
