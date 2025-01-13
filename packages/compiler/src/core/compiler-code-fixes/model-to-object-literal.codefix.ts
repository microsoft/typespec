import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { TupleExpressionNode, type CodeFixEdit, type ModelExpressionNode } from "../types.js";

import { createChildModelToObjValCodeFix } from "./common-codefix-convert-helper.js";

/**
 * Quick fix that convert a model expression to an object value.
 */
export function createModelToObjectValueCodeFix(node: ModelExpressionNode) {
  return defineCodeFix({
    id: "model-to-object-value",
    label: `Convert to an object value \`#{}\``,
    fix: (context) => {
      const result: CodeFixEdit[] = [];

      addCreatedCodeFixResult(node);
      createChildModelToObjValCodeFix(node, addCreatedCodeFixResult);

      return result;

      function addCreatedCodeFixResult(node: ModelExpressionNode | TupleExpressionNode) {
        const location = getSourceLocation(node);
        result.push(context.prependText(location, "#"));
      }
    },
  });
}
