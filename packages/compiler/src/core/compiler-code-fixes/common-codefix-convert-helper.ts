import { SyntaxKind, TupleExpressionNode, type ModelExpressionNode } from "../types.js";

export function createChildTupleToArrValCodeFix(
  node: TupleExpressionNode,
  addCreatedCodeFixResult: (node: ModelExpressionNode | TupleExpressionNode) => void,
) {
  for (const childNode of node.values) {
    if (childNode.kind === SyntaxKind.ModelExpression) {
      addCreatedCodeFixResult(childNode);
      createChildModelToObjValCodeFix(childNode, addCreatedCodeFixResult);
    } else if (childNode.kind === SyntaxKind.TupleExpression) {
      addCreatedCodeFixResult(childNode);
      createChildTupleToArrValCodeFix(childNode, addCreatedCodeFixResult);
    }
  }
}

export function createChildModelToObjValCodeFix(
  node: ModelExpressionNode,
  addCreatedCodeFixResult: (node: ModelExpressionNode | TupleExpressionNode) => void,
) {
  for (const prop of node.properties.values()) {
    if (prop.kind === SyntaxKind.ModelProperty) {
      const childNode = prop.value;

      if (childNode.kind === SyntaxKind.ModelExpression) {
        addCreatedCodeFixResult(childNode);
        createChildModelToObjValCodeFix(childNode, addCreatedCodeFixResult);
      } else if (childNode.kind === SyntaxKind.TupleExpression) {
        addCreatedCodeFixResult(childNode);
        createChildTupleToArrValCodeFix(childNode, addCreatedCodeFixResult);
      }
    }
  }
}
