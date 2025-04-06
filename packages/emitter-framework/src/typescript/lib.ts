import { createTypeSpecLibrary } from "@typespec/compiler";

export const $typescriptLib = createTypeSpecLibrary({
  name: "emitter-framework",
  diagnostics: {
    "typescript-unsupported-scalar": {
      severity: "warning",
      messages: {
        default: "Unsupported scalar type, falling back to any",
      },
    },
    "typescript-unsupported-type": {
      severity: "warning",
      messages: {
        default: "Unsupported type, falling back to any",
      },
      description: "This type is not supported by the emitter",
    },
    "typescript-unsupported-type-transform": {
      severity: "warning",
      messages: {
        default: "Unsupported type for transformation, falling back to not transforming this type",
      },
      description: "Discriminators at the model are not supported",
    },
    "typescript-unsupported-nondiscriminated-union": {
      severity: "error",
      messages: {
        default: "Unsupported non-discriminated union, falling back to not transforming this type",
      },
      description: "Non-discriminated unions are not supported",
    },
    "invalid-enum-type": {
      severity: "error",
      messages: {
        default:
          "For unions to be represented as enums, all variants must be string or numeric literals.",
      },
    },
  },
});

export const {
  reportDiagnostic: reportTypescriptDiagnostic,
  createDiagnostic: CreateTypescriptDiagnostic,
} = $typescriptLib;
