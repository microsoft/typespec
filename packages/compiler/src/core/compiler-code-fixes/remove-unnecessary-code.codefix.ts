import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { type ImportStatementNode, type UsingStatementNode } from "../types.js";

/**
 * Quick fix that remove unnecessary code.
 */
export function removeUnnecessaryCodeCodeFix(node: ImportStatementNode | UsingStatementNode) {
  return defineCodeFix({
    id: "remove-unnecessary-code",
    label: `Remove unnecessary code`,
    fix: (context) => {
      const location = getSourceLocation(node);
      return context.replaceText(location, "");
    },
  });
}
