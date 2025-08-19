import { resolveCodeFixCreateFile } from "../codefix-create-file-resolve.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import {
  CodeFixOptions,
  SyntaxKind,
  type CodeFixEdit,
  type ModelExpressionNode,
  type TupleExpressionNode,
} from "../types.js";

/**
 * Quick fix that convert a tuple to an array value.
 */
export function createTupleToArrayValueCodeFix(
  node: TupleExpressionNode,
  options: CodeFixOptions | undefined = undefined,
) {
  const { fileOptions, customLabel } = options || {};

  const defaultLabel = `Convert to an array value \`#[]\``;
  const label =
    customLabel ||
    (fileOptions?.creationLabel
      ? `${defaultLabel} in ${fileOptions.targetFilePath}`
      : defaultLabel);

  return defineCodeFix({
    id: fileOptions
      ? `tuple-to-array-value-in-file-${fileOptions.targetFilePath}`
      : "tuple-to-array-value",
    label,
    fix: async (context) => {
      if (fileOptions) {
        return await resolveCodeFixCreateFile(fileOptions, `\n// tuple-to-array-value`);
      } else {
        const result: CodeFixEdit[] = [];

        addCreatedCodeFixResult(node);
        createChildTupleToArrValCodeFix(node, addCreatedCodeFixResult);

        return result;

        function addCreatedCodeFixResult(node: ModelExpressionNode | TupleExpressionNode) {
          const location = getSourceLocation(node);
          result.push(context.prependText(location, "#"));
        }
      }
    },
  });
}

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

function createChildTupleToArrValCodeFix(
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

function createChildModelToObjValCodeFix(
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
