import { defineCodeFix, getSourceLocation } from "./diagnostics.js";
import type { DiagnosticTarget } from "./types.js";

export function createSuppressCodeFix(diagnosticTarget: DiagnosticTarget, warningCode: string) {
  return defineCodeFix({
    id: "suppress",
    label: `Suppress warning: "${warningCode}"`,
    fix: (context) => {
      const location = getSourceLocation(diagnosticTarget);
      return context.prependText(location, `#suppress "${warningCode}" ""\n`);
    },
  });
}
