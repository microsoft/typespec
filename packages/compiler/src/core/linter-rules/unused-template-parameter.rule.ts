import { removeUnusedTemplateParameterCodeFix } from "../compiler-code-fixes/remove-unused-template-parameter.codefix.js";
import { createLinterRule, paramMessage } from "../library.js";

export const builtInLinterRule_UnusedTemplateParameter = `unused-template-parameter`;

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
