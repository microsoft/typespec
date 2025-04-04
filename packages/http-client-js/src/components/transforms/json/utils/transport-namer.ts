import { Type } from "@typespec/compiler";

import { useTypekit } from "@typespec/emitter-framework";
import { reportDiagnostic } from "../../../../lib.js";

export function getJsonTransportName(type: Type) {
  const { $ } = useTypekit();

  if (!("name" in type)) {
    reportDiagnostic($.program, { code: "no-name-type", target: type });
    return "";
  }

  return $.type.getEncodedName(type as any, "json") ?? type.name;
}
