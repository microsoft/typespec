import { removeUnusedCodeCodeFix } from "../compiler-code-fixes/remove-unused-code.codefix.js";
import { createLinterRule, paramMessage } from "../library.js";

export const builtInLinterRule_UnusedImport = `unused-import`;

/** @internal */
export function createUnusedImportLinterRule() {
  return createLinterRule({
    name: builtInLinterRule_UnusedImport,
    severity: "warning",
    description: "Linter rule for unused import statements.",
    messages: {
      default: paramMessage`Import '${"path"}' is declared but never used.`,
    },
    create(context) {
      return {
        root: (program) => {
          program.resolver.getUnusedImports().forEach((target) => {
            context.reportDiagnostic({
              format: { path: target.path.value },
              target,
              codefixes: [removeUnusedCodeCodeFix(target)],
            });
          });
        },
      };
    },
  });
}
