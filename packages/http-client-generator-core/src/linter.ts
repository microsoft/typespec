import { defineLinter } from "@typespec/compiler";
import { noUnnamedTypesRule } from "./rules/no-unnamed-types.rule.js";
import { propertyNameConflictRule } from "./rules/property-name-conflict.rule.js";
import { requireClientSuffixRule } from "./rules/require-client-suffix.rule.js";

const rules = [requireClientSuffixRule, propertyNameConflictRule, noUnnamedTypesRule];

const csharpRules = [propertyNameConflictRule];

export const $linter = defineLinter({
  rules,
  ruleSets: {
    "best-practices:csharp": {
      enable: {
        ...Object.fromEntries(
          csharpRules.map((rule) => [
            `@typespec/http-client-generator-core/${rule.name}`,
            true,
          ]),
        ),
      },
    },
  },
});
