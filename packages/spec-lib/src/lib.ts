import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

const repoUrl = `https://github.com/Azure/cadl-ranch`;

export const $lib = createTypeSpecLibrary({
  name: "@azure-tools/cadl-ranch-expect",
  diagnostics: {
    "category-invalid": {
      severity: "error",
      messages: {
        default: paramMessage`Category "${"category"}" is not one of the allowed category. Use ${"allowed"}. See ${repoUrl}/blob/main/docs/decorators.md#category`,
      },
    },

    "missing-scenario": {
      severity: "warning",
      messages: {
        default: `Operation doesn't belong to a scenario. Use @scenario(name?: string) to mark it as a scenario. See ${repoUrl}/blob/main/docs/decorators.md#scenario`,
      },
    },
    "missing-scenario-doc": {
      severity: "warning",
      messages: {
        default: `Operation is missing a scenario doc. Use @scenarioDoc to provide the name of the scenario. See ${repoUrl}/blob/main/docs/decorators.md#scenariodoc`,
      },
    },
  },
});

export const reportDiagnostic = $lib.reportDiagnostic;
