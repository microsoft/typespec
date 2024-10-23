import { isWhiteSpace } from "../charcode.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { DiagnosticTarget, SourceLocation } from "../types.js";

export function createSuppressCodeFix(diagnosticTarget: DiagnosticTarget, warningCode: string) {
  return defineCodeFix({
    id: "suppress",
    label: `Suppress warning: "${warningCode}"`,
    fix: (context) => {
      const location = getSourceLocation(diagnosticTarget);
      const { lineStart, indent } = findLineStartAndIndent(location);
      const updatedLocation = { ...location, pos: lineStart };
      return context.prependText(updatedLocation, `${indent}#suppress "${warningCode}" ""\n`);
    },
  });
}

function findLineStartAndIndent(location: SourceLocation): { lineStart: number; indent: string } {
  const text = location.file.text;
  let pos = location.pos;
  let indent = 0;
  while (pos > 0 && text[pos - 1] !== "\n") {
    if (isWhiteSpace(text.charCodeAt(pos - 1))) {
      indent++;
    } else {
      indent = 0;
    }
    pos--;
  }
  return { lineStart: pos, indent: location.file.text.slice(pos, pos + indent) };
}
