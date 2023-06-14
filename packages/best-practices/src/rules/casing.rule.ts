import { createRule, paramMessage } from "@typespec/compiler";

export const casingRule = createRule({
  name: "casing",
  severity: "warning",
  description: "Enforce TypeSpec recommended naming convention for types.",
  messages: {
    default: paramMessage`Must match expected casing '${"casing"}'`,
  },
  create: (context) => {
    return {
      model: (model) => {
        if (!isPascalCaseNoAcronyms(model.name)) {
          context.reportDiagnostic({
            format: { casing: "PascalCase" },
            target: model,
          });
        }
      },
    };
  },
});

/**
 * Checks whether a given name is in PascalCase
 * @param name the name to check
 * @returns true if the name is in PascalCase
 */
function isPascalCaseNoAcronyms(name: string): boolean {
  if (name === "") return true;
  return /^([A-Z][a-z0-9]+)*[A-Z]?$/.test(name);
}
