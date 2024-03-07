import { defineLinter } from "@typespec/compiler";
import { opReferenceContainerRouteRule } from "./rules/op-reference-container-route.js";

export const $linter = defineLinter({
  rules: [opReferenceContainerRouteRule],
  ruleSets: {
    all: {
      enable: {
        [`@typespec/http/${opReferenceContainerRouteRule.name}`]: true,
      },
    },
  },
});
