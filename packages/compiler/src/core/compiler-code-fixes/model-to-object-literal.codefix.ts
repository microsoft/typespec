import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { ModelExpressionNode } from "../types.js";

/**
 * Quick fix that convert a model expression to an object value.
 */
export function createModelToObjectValueCodeFix(node: ModelExpressionNode) {
  return defineCodeFix({
    id: "model-to-object-value",
    label: `Convert to an object value \`#{}\``,
    fix: (context) => {
      const location = getSourceLocation(node);
      return context.prependText(location, "#");
    },
  });
}
