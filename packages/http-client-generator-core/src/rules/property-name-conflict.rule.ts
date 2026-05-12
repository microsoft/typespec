import { ModelProperty, createRule, paramMessage } from "@typespec/compiler";
import { createTCGCContext } from "../context.js";
import { getLibraryName } from "../public-utils.js";

export const propertyNameConflictRule = createRule({
  name: "property-name-conflict",
  description: "Avoid naming conflicts between a property and a model of the same name.",
  severity: "warning",
  url: "https://azure.github.io/typespec-azure/docs/libraries/typespec-client-generator-core/rules/property-name-conflict",
  messages: {
    default: paramMessage`Property '${"propertyName"}' having the same name as its enclosing model will cause problems with C# code generation. Consider renaming the property directly or using the @clientName("newName", "csharp") decorator to rename the property for C#.`,
  },
  create(context) {
    const tcgcContext = createTCGCContext(
      context.program,
      "@azure-tools/typespec-client-generator-core",
      {
        mutateNamespace: false,
      },
    );
    return {
      modelProperty: (property: ModelProperty) => {
        const model = property.model;
        if (!model) return;
        const modelName = getLibraryName(tcgcContext, model, "csharp").toLocaleLowerCase();
        const propertyName = getLibraryName(tcgcContext, property, "csharp").toLocaleLowerCase();
        if (propertyName === modelName) {
          context.reportDiagnostic({
            format: { propertyName },
            target: property,
          });
        }
        return;
      },
    };
  },
});
