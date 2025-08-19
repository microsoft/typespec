import { resolveCodeFixCreateFile } from "../codefix-create-file-resolve.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { CodeFixOptions, TemplateParameterDeclarationNode } from "../types.js";

/**
 * Quick fix that remove unused template parameter.
 */
export function removeUnusedTemplateParameterCodeFix(
  node: TemplateParameterDeclarationNode,
  options: CodeFixOptions | undefined = undefined,
) {
  const { fileOptions, customLabel } = options || {};

  const defaultLabel = `Remove unused template parameter ${node.id.sv}`;
  const label =
    customLabel ||
    (fileOptions?.creationLabel
      ? `${defaultLabel} in ${fileOptions.targetFilePath}`
      : defaultLabel);

  return defineCodeFix({
    id: fileOptions
      ? `remove-unused-template-parameter-in-file-${fileOptions.targetFilePath}`
      : "remove-unused-template-parameter",
    label,
    fix: async (context) => {
      if (fileOptions) {
        return await resolveCodeFixCreateFile(
          fileOptions,
          `\n// Remove unused template parameter ${node.id.sv}`,
        );
      } else {
        let location = getSourceLocation(node);
        const parent = node.parent;
        if (parent) {
          const length = parent.templateParameters.length;
          if (length === 1) {
            location = {
              file: location.file,
              pos: parent.templateParametersRange.pos,
              end: parent.templateParametersRange.end,
            };
          } else {
            const index = parent.templateParameters.findIndex((param) => param === node);
            if (index !== -1) {
              if (index !== parent.templateParameters.length - 1) {
                location = {
                  file: location.file,
                  pos: location.pos,
                  end: parent.templateParameters[index + 1].pos,
                };
              } else {
                location = {
                  file: location.file,
                  pos: parent.templateParameters[index - 1].end,
                  end: location.end,
                };
              }
            }
          }
        }
        return context.replaceText(location, "");
      }
    },
  });
}
