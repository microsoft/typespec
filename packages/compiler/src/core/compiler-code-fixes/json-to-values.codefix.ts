import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { CodeFixEdit, DiagnosticTarget, ObjectLiteralNode, SyntaxKind, Type } from "../types.js";

export function createJsonToValuesCodeFix(diagnosticTarget: DiagnosticTarget | Node) {
  return defineCodeFix({
    id: "json-to-values",
    label: `Convert json to values`,
    fix: (context) => {
      const result: CodeFixEdit[] = [];

      if (
        "kind" in diagnosticTarget &&
        typeof diagnosticTarget.kind === "number" &&
        diagnosticTarget.kind === SyntaxKind.ObjectLiteral &&
        diagnosticTarget.properties.length === 2
      ) {
        // Test use
        createCodeFix(diagnosticTarget);
      } else {
        // Actual use
        const targetNode = (diagnosticTarget as Type).node;
        if (targetNode?.kind === SyntaxKind.ObjectLiteral && targetNode.properties.length === 2) {
          createCodeFix(targetNode);
        }
      }

      return result;

      function createCodeFix(node: ObjectLiteralNode) {
        const firstNode = node.properties[0];
        const lastNode = node.properties[1];
        const location = getSourceLocation(firstNode);

        const newText = location.file.text.slice(location.pos + 1, lastNode.pos - 1);
        result.push(context.replaceText(location, newText));
      }
    },
  });
}
