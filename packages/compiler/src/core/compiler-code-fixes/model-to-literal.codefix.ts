import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { ModelExpressionNode } from "../types.js";

/**
 * Quick fix that convert a model expression to an object literal.
 */
export function createModelToLiteralCodeFix(node: ModelExpressionNode) {
  return defineCodeFix({
    id: "model-to-literal",
    label: `Convert to an object literal \`#{}\``,
    fix: (context) => {
      const location = getSourceLocation(node);
      return context.prependText(location, "#");
    },
  });
}
