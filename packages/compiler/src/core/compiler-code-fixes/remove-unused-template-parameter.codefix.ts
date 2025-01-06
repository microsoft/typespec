import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { TemplateParameterDeclarationNode } from "../types.js";

/**
 * Quick fix that remove unused template parameter.
 */
export function removeUnusedTemplateParameterCodeFix(node: TemplateParameterDeclarationNode) {
  return defineCodeFix({
    id: "remove-unused-template-parameter",
    label: `Remove unused template parameter ${node.id.sv}`,
    fix: (context) => {
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
    },
  });
}
