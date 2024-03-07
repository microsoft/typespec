import { createTypeSpecLibrary } from "@typespec/compiler";
import { casingRule } from "./rules/casing.rule.js";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/best-practices",
  diagnostics: {},
  linter: {
    rules: [casingRule],
    ruleSets: {
      recommended: {
        enable: { [`@typespec/best-practices/${casingRule.name}`]: true },
      },
    },
  },
});

export const { reportDiagnostic, createStateSymbol } = $lib;
