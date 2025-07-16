import type { Type } from "@typespec/compiler";
import { type Typekit } from "@typespec/compiler/typekit";
import { reportDiagnostic } from "../../../../lib.js";

export function getJsonTransportName($: Typekit, type: Type) {
  if (!("name" in type)) {
    reportDiagnostic($.program, { code: "no-name-type", target: type });
    return "";
  }

  return $.type.getEncodedName(type as any, "json") ?? type.name;
}
