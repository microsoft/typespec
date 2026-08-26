import { createTypeSpecLibrary } from "@typespec/compiler";

export const $pythonLib = createTypeSpecLibrary({
  name: "emitter-framework",
  diagnostics: {
    "python-unsupported-scalar": {
      severity: "warning",
      messages: {
        default: "Unsupported scalar type, falling back to Any",
      },
    },
    "python-unsupported-type": {
      severity: "error",
      messages: {
        default: "Unsupported type, falling back to Any",
      },
      description: "This type is not supported by the Python emitter",
    },
    "python-unsupported-model-discriminator": {
      severity: "error",
      messages: {
        default:
          "Unsupported model discriminator, falling back to not discriminating on serialization/deserialization",
      },
      description: "Discriminators at the model are not supported",
    },
    "python-unsupported-type-transform": {
      severity: "error",
      messages: {
        default: "Unsupported type for transformation, falling back to not transforming this type",
      },
      description: "This type cannot be transformed",
    },
  },
});

export const {
  reportDiagnostic: reportPythonDiagnostic,
  createDiagnostic: createPythonDiagnostic,
} = $pythonLib;
