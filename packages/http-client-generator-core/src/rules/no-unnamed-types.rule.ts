import { createRule, Model, paramMessage, Union } from "@typespec/compiler";
import { createTCGCContext } from "../context.js";
import {
  isSdkBuiltInKind,
  SdkEnumType,
  SdkModelType,
  SdkNullableType,
  SdkType,
  SdkUnionType,
  UsageFlags,
} from "../interfaces.js";
import { handleAllTypes } from "../types.js";

export const noUnnamedTypesRule = createRule({
  name: "no-unnamed-types",
  description: "Requires types to be named rather than defined anonymously or inline.",
  severity: "warning",
  url: "https://azure.github.io/typespec-azure/docs/libraries/typespec-client-generator-core/rules/no-unnamed-types",
  messages: {
    default: paramMessage`Anonymous ${"type"} with generated name "${"generatedName"}" detected. Define this ${"type"} separately with a proper name to improve code readability and reusability.`,
  },
  create(context) {
    const tcgcContext = createTCGCContext(
      context.program,
      "@azure-tools/typespec-client-generator-core",
      {
        mutateNamespace: false,
      },
    );
    // Run the type-handling pass to populate __referencedTypeCache so we can
    // determine which types are referenced and how they are used in the final output.
    handleAllTypes(tcgcContext);
    return {
      model: (model: Model) => {
        const createdModel = tcgcContext.__referencedTypeCache.get(model);
        if (
          createdModel &&
          createdModel.kind === "model" &&
          createdModel.properties.length > 0 &&
          createdModel.usage !== UsageFlags.None &&
          (createdModel.usage & UsageFlags.LroInitial) === 0 &&
          (createdModel.usage & UsageFlags.MultipartFormData) === 0 &&
          createdModel.isGeneratedName
        ) {
          context.reportDiagnostic({
            target: model,
            format: {
              type: "model",
              generatedName: createdModel.name,
            },
          });
        }
      },
      union: (union: Union) => {
        const createdUnion = tcgcContext.__referencedTypeCache.get(union);
        const unionToCheck = getUnionType(createdUnion);
        if (
          unionToCheck &&
          unionToCheck.usage !== UsageFlags.None &&
          unionToCheck.isGeneratedName &&
          !allVariantsBuiltIn(unionToCheck)
        ) {
          // report diagnostic for unions and nullable unions
          context.reportDiagnostic({
            target: union,
            format: {
              type: "union",
              generatedName: unionToCheck.name,
            },
          });
        }
      },
    };
  },
});

function getUnionType(
  union: SdkModelType | SdkEnumType | SdkNullableType | SdkUnionType<SdkType> | undefined,
): SdkModelType | SdkEnumType | SdkNullableType | SdkUnionType<SdkType> | undefined {
  if (!union) {
    return undefined;
  }
  if (union.kind === "nullable") {
    const inner = union.type;
    if (inner.kind === "union" || inner.kind === "model" || inner.kind === "enum") {
      return inner;
    }
    return undefined;
  }
  return union;
}

function allVariantsBuiltIn(
  union: SdkModelType | SdkEnumType | SdkNullableType | SdkUnionType<SdkType>,
): boolean {
  if (union.kind !== "union") {
    return false;
  }
  return union.variantTypes.every((variant) => {
    return isSdkBuiltInKind(variant.kind);
  });
}
