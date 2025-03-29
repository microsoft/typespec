import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http/experimental/typekit",
  diagnostics: {
    "http-operation-body-missing-property": {
      severity: "warning",
      messages: {
        default: `The body parameter is missing a property.`,
      },
    },
  },
});

export const {
  reportDiagnostic: reportTypekitDiagnostic,
  createDiagnostic: createTypekitDiagnostic,
} = $lib;
