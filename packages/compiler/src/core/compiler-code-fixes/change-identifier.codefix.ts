import { resolveCodeFixCreateFile } from "../codefix-create-file-resolve.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { CodeFixOptions, IdentifierNode } from "../types.js";

export function createChangeIdentifierCodeFix(
  node: IdentifierNode,
  newIdentifier: string,
  options: CodeFixOptions | undefined = undefined,
) {
  const { fileOptions, customLabel } = options || {};

  const defaultLabel = `Change ${node.sv} to ${newIdentifier}`;
  const label =
    customLabel ||
    (fileOptions?.creationLabel
      ? `${defaultLabel} in ${fileOptions.targetFilePath}`
      : defaultLabel);

  return defineCodeFix({
    id: fileOptions
      ? `change-identifier-in-file-${fileOptions.targetFilePath}`
      : "change-identifier",
    label,
    fix: async (context) => {
      if (fileOptions) {
        return await resolveCodeFixCreateFile(
          fileOptions,
          `\n// Changed ${node.sv} to ${newIdentifier}`,
        );
      } else {
        const location = getSourceLocation(node);
        return context.replaceText(location, newIdentifier);
      }
    },
  });
}
