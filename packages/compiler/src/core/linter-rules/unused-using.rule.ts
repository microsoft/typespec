import { removeUnusedCodeCodeFix } from "../compiler-code-fixes/remove-unused-code.codefix.js";
import { createLinterRule, paramMessage } from "../library.js";
import { NameResolver } from "../name-resolver.js";
import { IdentifierNode, MemberExpressionNode, SyntaxKind } from "../types.js";

export const builtInLinterRule_UnusedUsing = `unused-using`;

/** @internal */
export function createUnusedUsingLinterRule(nameResolver: NameResolver) {
  return createLinterRule({
    name: builtInLinterRule_UnusedUsing,
    severity: "warning",
    description: "Linter rules for unused using statement.",
    messages: {
      default: paramMessage`'using ${"code"}' is declared but never used.`,
    },
    create(context) {
      return {
        root: (_root) => {
          const getUsingName = (node: MemberExpressionNode | IdentifierNode): string => {
            if (node.kind === SyntaxKind.MemberExpression) {
              return `${getUsingName(node.base)}${node.selector}${node.id.sv}`;
            } else {
              // identifier node
              return node.sv;
            }
          };
          nameResolver.getUnusedUsings().forEach((target) => {
            context.reportDiagnostic({
              format: { code: getUsingName(target.name) },
              target,
              codefixes: [removeUnusedCodeCodeFix(target)],
            });
          });
        },
      };
    },
  });
}
