import { removeUnusedCodeCodeFix } from "./compiler-code-fixes/remove-unused-code.codefix.js";
import { removeUnusedTemplateParameterCodeFix } from "./compiler-code-fixes/remove-unused-template-parameter.codefix.js";
import { createLinterRule, paramMessage } from "./library.js";
import { NameResolver } from "./name-resolver.js";
import { IdentifierNode, MemberExpressionNode, SyntaxKind } from "./types.js";

export const builtInLinterRule_UnusedUsing = `unused-using`;
export const builtInLinterRule_UnusedTemplateParameter = `unused-template-parameter`;

/** @internal */
export function createUnusedUsingLinterRule(nameResolver: NameResolver) {
  return createLinterRule({
    name: builtInLinterRule_UnusedUsing,
    severity: "warning",
    description: "Linter rules for unused using statement.",
    messages: {
      default: paramMessage`'using ${"code"}' is declared but never be used.`,
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
              messageId: "default",
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

/** @internal */
export function createUnusedTemplateParameterLinterRule() {
  return createLinterRule({
    name: builtInLinterRule_UnusedTemplateParameter,
    severity: "warning",
    description: "Linter rules for unused template parameter.",
    messages: {
      default: paramMessage`Templates should use all specified parameters, and parameter '${"parameterName"}' does not exist in type '${"type"}'. Consider removing this parameter.`,
    },
    create(context) {
      return {
        root: (_root) => {
          const templateParameters = context.program.checker
            .getTemplateParameterUsageMap()
            .entries();
          for (const [templateParameter, used] of templateParameters) {
            if (!used) {
              context.reportDiagnostic({
                messageId: "default",
                format: {
                  parameterName: templateParameter.id.sv,
                  type: templateParameter.parent?.symbol.name ?? "",
                },
                target: templateParameter,
                codefixes: [removeUnusedTemplateParameterCodeFix(templateParameter)],
              });
            }
          }
        },
      };
    },
  });
}
