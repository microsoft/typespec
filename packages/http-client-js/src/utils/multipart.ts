import type { Type } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { reportDiagnostic } from "../lib.js";

export function isMultipart(type: Type): boolean {
  const { $ } = useTsp();
  const body = type;

  if (!$.model.is(body)) {
    return false;
  }

  let multipartCount = 0;
  let nonMultipartCount = 0;
  for (const prop of body.properties.values()) {
    if ($.httpPart.is(prop.type)) {
      multipartCount++;
    } else if (!$.array.is(prop.type)) {
      nonMultipartCount++;
    }
  }

  if (multipartCount > 0 && nonMultipartCount > 0) {
    reportDiagnostic($.program, { code: "mixed-part-nonpart", target: type });
    return false;
  }

  return multipartCount > 0;
}
