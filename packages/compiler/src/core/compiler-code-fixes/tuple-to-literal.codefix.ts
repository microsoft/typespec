import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { TupleExpressionNode } from "../types.js";

/**
 * Quick fix that convert a tuple to an array literal.
 */
export function createTupleToLiteralCodeFix(node: TupleExpressionNode) {
  return defineCodeFix({
    id: "tuple-to-literal",
    label: `Convert to an array literal \`#[]\``,
    fix: (context) => {
      const location = getSourceLocation(node);
      return context.prependText(location, "#");
    },
  });
}
