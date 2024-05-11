import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { TupleExpressionNode } from "../types.js";

/**
 * Quick fix that convert a tuple to an array value.
 */
export function createTupleToArrayValueCodeFix(node: TupleExpressionNode) {
  return defineCodeFix({
    id: "tuple-to-array-value",
    label: `Convert to an array value \`#[]\``,
    fix: (context) => {
      const location = getSourceLocation(node);
      return context.prependText(location, "#");
    },
  });
}
