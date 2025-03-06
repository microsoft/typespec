import { ModelProperty } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";

export function isConstantHeader(modelProperty: ModelProperty) {
  if (!$.modelProperty.isHttpHeader(modelProperty)) {
    return false;
  }

  if ("value" in modelProperty.type && modelProperty.type.value !== undefined) {
    return true;
  }

  return false;
}
