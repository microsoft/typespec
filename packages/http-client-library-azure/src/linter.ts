import { defineLinter } from "@typespec/compiler";
import { noInterfaceRule } from "./rules/no-interfaces.rule.js";

export const $linter = defineLinter({
  rules: [noInterfaceRule],
  ruleSets: {
    recommended: {
      enable: { [`@typespec/http-client-library-azure/${noInterfaceRule.name}`]: true },
    },
    all: {
      enable: { [`@typespec/http-client-library-azure/${noInterfaceRule.name}`]: true },
    },
  },
});
