import { defineLinter } from "@typespec/compiler";
import { opReferenceContainerRouteRule } from "./rules/op-reference-container-route.js";

/** Linter definition exposing HTTP rules, including checks for routes on referenced operation containers. */
export const $linter = defineLinter({
  rules: [opReferenceContainerRouteRule],
});
