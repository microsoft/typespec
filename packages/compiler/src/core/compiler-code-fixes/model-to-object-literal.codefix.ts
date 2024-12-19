import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import {
  SyntaxKind,
  TupleExpressionNode,
  type CodeFixEdit,
  type ModelExpressionNode,
} from "../types.js";

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
      createChildModelToObjValCodeFix(node);

      return result;

      function addCreatedCodeFixResult(node: ModelExpressionNode | TupleExpressionNode) {
        const location = getSourceLocation(node);
        result.push(context.prependText(location, "#"));
      }

      function createChildTupleToArrValCodeFix(node: TupleExpressionNode) {
        for (const childNode of node.values) {
          if (childNode.kind === SyntaxKind.ModelExpression) {
            addCreatedCodeFixResult(childNode);
            createChildModelToObjValCodeFix(childNode);
          } else if (childNode.kind === SyntaxKind.TupleExpression) {
            addCreatedCodeFixResult(childNode);
            createChildTupleToArrValCodeFix(childNode);
          }
        }
      }

      function createChildModelToObjValCodeFix(node: ModelExpressionNode) {
        for (const prop of node.properties.values()) {
          if (prop.kind === SyntaxKind.ModelProperty) {
            const childNode = prop.value;

            if (childNode.kind === SyntaxKind.ModelExpression) {
              addCreatedCodeFixResult(childNode);
              createChildModelToObjValCodeFix(childNode);
            } else if (childNode.kind === SyntaxKind.TupleExpression) {
              addCreatedCodeFixResult(childNode);
              createChildTupleToArrValCodeFix(childNode);
            }
          }
        }
      }
    },
  });
}
