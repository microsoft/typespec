import {
  getDoc,
  getSourceLocation,
  getTypeName,
  listServices,
  paramMessage,
} from "@typespec/compiler";
import { inspect } from "util";
import { LmRuleChecker } from "../lm/lm-rule-checker.js";
import { reportLmErrors } from "../lm/lm-utils.js";
import { LmDiagnosticMessages, LmFamily, LmResponseError } from "../lm/types.js";
import {
  createRenameCodeFix,
  createRuleWithLmRuleChecker,
  getClientNameFromDec,
  isDirectPropertyOfModel,
  isMyCode,
  isUnnamedModelProperty,
  splitNameByUpperCase,
} from "./rule-utils.js";
import { RenameData, zRenameCheckResult } from "./types.js";

/**
 * This linter rule is not completed yet, put it here just to simulate a "bad" linter rule which will need to check
 * hundreds of properties in a large project so that we can understand how the linter with AI support will perform in this case.
 */
const ruleName = "csharp.naming.avoid-too-generic-name";
const aiChecker = new LmRuleChecker(
  "too-general",
  [
    {
      role: "user",
      message: `Check the given property names which are in camel or pascal case. If the property name is too generic that may cause confusion or confliction with the properties from other model or services, it should be renamed to be more specific. Suggest a few better name according to the given information in this case.`,
    },
  ],
  {
    modelPreferences: LmFamily.gpt5mini,
  },
  zRenameCheckResult,
);
export const tooGenericRule = createRuleWithLmRuleChecker(aiChecker, {
  name: ruleName,
  severity: "warning",
  description:
    "Avoid too generic name which does not provide enough context or information about the property as well as may cause confliction with other properties from other models or services.",
  messages: {
    ...LmDiagnosticMessages,
    errorOccurs: paramMessage`CSharpNaming: Unexpected error occurs when checking generic naming '${"modelName"}.${"propName"}'. You may check console or VSCode TypeSpec Output logs for more details. Error: ${"error"}`,
    tooGeneric: paramMessage`CSharpNaming: Property '${"modelName"}.${"propName"}' is too generic. ${"newNameSuggestions"}`,
  },
  create: (context) => {
    return {
      root: async (program) => {
        aiChecker.messages.push({
          role: "user",
          message: `As a context, the current project has the following services: [${listServices(
            program,
          )
            .map((s) => `{namespace: ${getTypeName(s.type)}, title: "${s.title ?? "No title"}"}`)
            .join(", ")}]`,
        });
      },
      modelProperty: async (property) => {
        if (
          !isMyCode(property, context) ||
          !isDirectPropertyOfModel(property) ||
          isUnnamedModelProperty(property)
        ) {
          return;
        }
        const src = getSourceLocation(property);
        // console.debug(
        //   `Start checking property '${property.model?.name ?? "N/A"}.${property.name}' at ${src?.file.path}:${src?.pos}:${src?.end}`,
        // );

        const docString = getDoc(context.program, property);
        const [n, clientNameDec] = getClientNameFromDec(property, "csharp");
        const propName = n ?? property.name;
        const modelName = property.model ? getTypeName(property.model) : "NoModel";
        const description = `It is a property name '${propName}' in model '${modelName}'. ${
          docString && docString.length > 0 ? `The property description is: ${docString}` : ""
        }`;
        const words = splitNameByUpperCase(propName);
        if (words.length > 2) {
          // only check whether the name is too generic if it has more than 2 words
          return;
        }

        const data: RenameData = {
          originalName: propName,
          description,
        };

        try {
          const result = await aiChecker.queueDataToCheck(data);
          if (result.renameNeeded) {
            const suggestedNames = result.suggestedNames;
            context.reportDiagnostic({
              target: property,
              messageId: "tooGeneric",
              format: {
                modelName: property.model?.name ?? "unknown",
                propName: property.name,
                newNameSuggestions:
                  suggestedNames.length > 0
                    ? `New name suggestions: ${suggestedNames.join(", ")}`
                    : "Please give it a more specific name.",
              },
              codefixes: createRenameCodeFix(result, clientNameDec, context, property),
            });
          }
        } catch (error) {
          // TODO: handle other error
          reportLmErrors(error as LmResponseError, property, context, (r) => {
            context.reportDiagnostic({
              target: property,
              messageId: "errorOccurs",
              format: {
                modelName: property.model?.name ?? "unknown",
                propName: property.name,
                error: `${inspect(r)}`,
              },
            });
          });
          return;
        }
      },
    };
  },
});
