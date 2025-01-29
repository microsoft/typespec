import { defineLinter } from "@typespec/compiler";
import { noInterfaceRule } from "./rules/no-interfaces.rule.js";

export const $linter = defineLinter({
  rules: [noInterfaceRule],
  ruleSets: {
    recommended: {
      enable: { [`@typespec&#x2F;http-client/${noInterfaceRule.name}`]: true },
    },
    all: {
      enable: { [`@typespec&#x2F;http-client/${noInterfaceRule.name}`]: true },
    },
  },
});
