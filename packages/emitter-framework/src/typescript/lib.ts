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
      severity: "warning", // TODO: Warning for release and error for debug
      messages: {
        default: "Unsupported type, falling back to any",
      },
      description: "This type is not supported by the emitter",
    },
    "typescript-unsupported-model-discriminator": {
      severity: "warning", // TODO: Warning for release and error for debug
      messages: {
        default:
          "Unsupported model discriminator, falling back to not discriminating on serialization/deserialization",
      },
      description: "Discriminators at the model are not supported",
    },
    "typescript-unsupported-type-transform": {
      severity: "warning", // TODO: Warning for release and error for debug
      messages: {
        default: "Unsupported type for transformation, falling back to not transforming this type",
      },
      description: "Discriminators at the model are not supported",
    },
    "typescript-unsupported-nondiscriminated-union": {
      severity: "warning", // TODO: Warning for release and error for debug
      messages: {
        default: "Unsupported non-discriminated union, falling back to not transforming this type",
      },
      description: "Non-discriminated unions are not supported",
    },
    "typescript-extended-model-transform-nyi": {
      severity: "warning", // TODO: Warning for release and error for debug
      messages: {
        default: "Extended model transformation is not yet implemented",
      },
      description: "Extended model transformation is not yet implemented",
    },
    "typescript-spread-model-transformation-nyi": {
      severity: "warning", // TODO: Warning for release and error for debug
      messages: {
        default: "Spread model transformation is not yet implemented",
      },
      description: "Spread model transformation is not yet implemented",
    },
  },
});

export const {
  reportDiagnostic: reportTypescriptDiagnostic,
  createDiagnostic: CreateTypescriptDiagnostic,
} = $typescriptLib;
