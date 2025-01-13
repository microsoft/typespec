import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { type CodeFixEdit, type ModelExpressionNode, type TupleExpressionNode } from "../types.js";
import { createChildTupleToArrValCodeFix } from "./common-codefix-convert-helper.js";

/**
 * Quick fix that convert a tuple to an array value.
 */
export function createTupleToArrayValueCodeFix(node: TupleExpressionNode) {
  return defineCodeFix({
    id: "tuple-to-array-value",
    label: `Convert to an array value \`#[]\``,
    fix: (context) => {
      const result: CodeFixEdit[] = [];

      addCreatedCodeFixResult(node);
      createChildTupleToArrValCodeFix(node, addCreatedCodeFixResult);

      return result;

      function addCreatedCodeFixResult(node: ModelExpressionNode | TupleExpressionNode) {
        const location = getSourceLocation(node);
        result.push(context.prependText(location, "#"));
      }
    },
  });
}
