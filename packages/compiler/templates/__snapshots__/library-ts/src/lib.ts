import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";
import { noInterfaceRule } from "./rules/no-interfaces.rule.js";

export const $lib = createTypeSpecLibrary({
  name: "library-ts",
  diagnostics: {
    "banned-alternate-name": {
      severity: "error",
      messages: {
        default: paramMessage`Banned alternate name "${"name"}".`,
      },
    },
  },
  linter: {
    rules: [noInterfaceRule],
    ruleSets: {
      recommended: {
        enable: { [`library-ts/${noInterfaceRule.name}`]: true },
      },
      all: {
        enable: { [`library-ts/${noInterfaceRule.name}`]: true },
      },
    },
  },
});

export const { reportDiagnostic, createDiagnostic, createStateSymbol } = $lib;
