import { defineLinter } from "@typespec/compiler";
import { noContentTypeOptionalityMismatchRule } from "./rules/no-content-type-optionality-mismatch.js";
import { opReferenceContainerRouteRule } from "./rules/op-reference-container-route.js";

export const $linter = defineLinter({
  rules: [opReferenceContainerRouteRule, noContentTypeOptionalityMismatchRule],
});
