import { defineLinter } from "@typespec/compiler";
import { conflictingRouteRule } from "./rules/conflicting-route.rule.js";
import { opReferenceContainerRouteRule } from "./rules/op-reference-container-route.js";

export const $linter = defineLinter({
  rules: [opReferenceContainerRouteRule, conflictingRouteRule],
});
