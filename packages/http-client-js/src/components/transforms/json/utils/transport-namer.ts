import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { reportDiagnostic } from "../../../../lib.js";

export function getJsonTransportName(type: Type) {
  if (!("name" in type)) {
    reportDiagnostic($.program, { code: "no-name-type", target: type });
    return "";
  }

  return $.type.getEncodedName(type as any, "json") ?? type.name;
}
