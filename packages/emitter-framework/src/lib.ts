import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "emitter-framework",
  diagnostics: {
    "typescript-unsupported-scalar": {
      severity: "warning",
      messages: {
        default: "Unsupported scalar type, falling back to any",
      },
    },
    "typescript-unsupported-type": {
      severity: "error", // TODO: Warning for release and error for debug
      messages: {
        default: "Unsupported type, falling back to any",
      },
      description: "This type is not supported by the emitter",
    },
    "typescript-unsupported-model-discriminator": {
      severity: "error", // TODO: Warning for release and error for debug
      messages: {
        default:
          "Unsupported model discriminator, falling back to not discriminating on serialization/deserialization",
      },
      description: "Discriminators at the model are not supported",
    },
    "typescript-unsupported-type-transform": {
      severity: "error", // TODO: Warning for release and error for debug
      messages: {
        default: "Unsupported type for transformation, falling back to not transforming this type",
      },
      description: "Discriminators at the model are not supported",
    },
    "typescript-unsupported-nondiscriminated-union": {
      severity: "error", // TODO: Warning for release and error for debug
      messages: {
        default: "Unsupported non-discriminated union, falling back to not transforming this type",
      },
      description: "Non-discriminated unions are not supported",
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
