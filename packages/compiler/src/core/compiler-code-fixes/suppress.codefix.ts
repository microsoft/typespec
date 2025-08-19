import { isWhiteSpace } from "../charcode.js";
import { resolveCodeFixCreateFile } from "../codefix-create-file-resolve.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { CodeFixOptions, DiagnosticTarget, SourceLocation } from "../types.js";

export function createSuppressCodeFix(
  diagnosticTarget: DiagnosticTarget,
  warningCode: string,
  options: CodeFixOptions | undefined = undefined,
) {
  const { fileOptions, customLabel } = options || {};

  const defaultLabel = `Suppress warning: "${warningCode}"`;
  const label =
    customLabel ||
    (fileOptions?.creationLabel
      ? `${defaultLabel} in ${fileOptions.targetFilePath}`
      : defaultLabel);

  return defineCodeFix({
    id: fileOptions ? `suppress-in-file-${fileOptions.targetFilePath}` : "suppress",
    label,
    fix: async (context) => {
      if (fileOptions) {
        return await resolveCodeFixCreateFile(fileOptions, `\n// suppress "${warningCode}"`);
      } else {
        const location = getSourceLocation(diagnosticTarget);
        const { lineStart, indent } = findLineStartAndIndent(location);
        const updatedLocation = { ...location, pos: lineStart };
        return context.prependText(updatedLocation, `${indent}#suppress "${warningCode}" ""\n`);
      }
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
