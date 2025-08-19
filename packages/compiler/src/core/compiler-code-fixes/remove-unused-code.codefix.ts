import { resolveCodeFixCreateFile } from "../codefix-create-file-resolve.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { CodeFixOptions, type ImportStatementNode, type UsingStatementNode } from "../types.js";

/**
 * Quick fix that remove unused code.
 */
export function removeUnusedCodeCodeFix(
  node: ImportStatementNode | UsingStatementNode,
  options: CodeFixOptions | undefined = undefined,
) {
  const { fileOptions, customLabel } = options || {};

  const defaultLabel = `Remove unused code`;
  const label =
    customLabel ||
    (fileOptions?.creationLabel
      ? `${defaultLabel} in ${fileOptions.targetFilePath}`
      : defaultLabel);

  return defineCodeFix({
    id: fileOptions
      ? `remove-unused-code-in-file-${fileOptions.targetFilePath}`
      : "remove-unused-code",
    label,
    fix: async (context) => {
      if (fileOptions) {
        return await resolveCodeFixCreateFile(fileOptions, `\n// Remove unused code`);
      } else {
        const location = getSourceLocation(node);
        return context.replaceText(location, "");
      }
    },
  });
}
