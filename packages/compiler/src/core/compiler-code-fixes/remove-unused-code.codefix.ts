import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { type ImportStatementNode, type UsingStatementNode } from "../types.js";

/**
 * Quick fix that remove unused code.
 */
export function removeUnusedCodeCodeFix(node: ImportStatementNode | UsingStatementNode) {
  return defineCodeFix({
    id: "remove-unused-code",
    label: `Remove unused code`,
    fix: (context) => {
      const location = getSourceLocation(node);
      return context.replaceText(location, "");
    },
  });
}
