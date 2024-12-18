import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { SyntaxKind, type CodeFixEdit, type ModelExpressionNode } from "../types.js";

/**
 * Quick fix that convert a model expression to an object value.
 */
export function createModelToObjectValueCodeFix(node: ModelExpressionNode) {
  return defineCodeFix({
    id: "model-to-object-value",
    label: `Convert to an object value \`#{}\``,
    fix: (context) => {
      const result: CodeFixEdit[] = [];

      const location = getSourceLocation(node);
      result.push(context.prependText(location, "#"));
      createChildModelToObjValCodeFix(node);

      return result;

      function createChildModelToObjValCodeFix(node: ModelExpressionNode) {
        for (const prop of node.properties.values()) {
          if (prop.kind === SyntaxKind.ModelProperty) {
            const childNode = prop.value;
            if (childNode.kind === SyntaxKind.ModelExpression) {
              const locationChild = getSourceLocation(childNode);
              result.push(context.prependText(locationChild, "#"));
              createChildModelToObjValCodeFix(childNode);
            }
          }
        }
      }
    },
  });
}
