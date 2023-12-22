import { createTypeSpecLibrary } from "@typespec/compiler";
import { internalLib } from "./internal-lib.js";
import { opReferenceContainerRouteRule } from "./rules/op-reference-container-route.js";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http",
  internal: internalLib,
  linter: {
    rules: [opReferenceContainerRouteRule],
    ruleSets: {
      all: {
        enable: {
          [`@typespec/http/${opReferenceContainerRouteRule.name}`]: true,
        },
      },
    },
  },
});
