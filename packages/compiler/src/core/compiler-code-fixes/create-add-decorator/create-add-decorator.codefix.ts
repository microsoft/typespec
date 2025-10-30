import { defineCodeFix, getSourceLocation } from "../../diagnostics.js";
import { CodeFix, DiagnosticTarget } from "../../types.js";
import { findLineStartAndIndent } from "../utils.js";

/**
 * Create a codefix to add a decorator at the target location.
 * @param diagnosticTarget Diagnostic target
 * @param decoratorName Decorator name(e.g. `doc`)
 * @param decoratorParamText Decorator args(e.g. `"This is a doc string."`)
 */
export function createAddDecoratorCodeFix(
  diagnosticTarget: DiagnosticTarget,
  name: string,
  args?: string[],
): CodeFix {
  return defineCodeFix({
    id: `add-decorator-${name}`,
    label: "Add `@${decoratorName}` decorator.",
    fix: (context) => {
      const location = getSourceLocation(diagnosticTarget);
      const { lineStart, indent } = findLineStartAndIndent(location);
      const updatedLocation = { ...location, pos: lineStart };
      const decText = args ? `${name}(${args.join(", ")})\n` : name;
      return context.prependText(updatedLocation, `${indent}@${decText}`);
    },
  });
}
