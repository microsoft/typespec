import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/spec-lib",
  diagnostics: {
    "category-invalid": {
      severity: "error",
      messages: {
        default: paramMessage`Category "${"category"}" is not one of the allowed category. Use ${"allowed"}. See https://github.com/Azure/cadl-ranch/blob/main/docs/decorators.md#category`,
      },
    },

    "missing-scenario": {
      severity: "warning",
      messages: {
        default: `Operation doesn't belong to a scenario. Use @scenario(name?: string) to mark it as a scenario. See https://github.com/Azure/cadl-ranch/blob/main/docs/decorators.md#scenario`,
      },
    },
    "missing-scenario-doc": {
      severity: "warning",
      messages: {
        default: `Operation is missing a scenario doc. Use @scenarioDoc to provide the name of the scenario. See https://github.com/Azure/cadl-ranch/blob/main/docs/decorators.md#scenariodoc`,
      },
    },
  },
  state: {
    Scenario: { description: "Mark a scenario to be executed" },
    ScenarioDoc: { description: "Mark a scenario documentation" },
    ScenarioService: { description: "Mark a scenario service to be executed" },
  },
});

export const { reportDiagnostic, createStateSymbol, stateKeys: SpecLibStateKeys } = $lib;
