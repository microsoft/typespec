import { getDoc, getTypeName, paramMessage } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
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
} from "./rule-utils.js";
import { RenameData, zRenameCheckResult } from "./types.js";

const aiChecker = new LmRuleChecker(
  "duration-with-unit",
  [
    {
      role: "user",
      message: `Check the given property names which are in camel or pascal case. If the property is for internvals or durations, it MUST ends with a unit suffix in format '...In<Unit>' (i.e: should be MonitoringIntervalInSeconds instead of MonitoringInterval, TimeToLiveDurationInMilliseconds instead of TimeToLiveDuration), otherwise suggest a new name with a proper suffix if you can determine the correct unit to use, otherwise DO NOT guess a unit suffix if you are not sure about the correct unit, just DON'T provide suggestions in that case.`,
    },
  ],
  {
    modelPreferences: LmFamily.gpt5mini,
  },
  zRenameCheckResult,
);

const ruleName = "csharp.naming.duration-with-unit";
export const durationWithUnitRule = createRuleWithLmRuleChecker(aiChecker, {
  name: ruleName,
  severity: "warning",
  description:
    "DO End property or parameter names of type integer that represent intervals or durations with units, for example: MonitoringInterval -> MonitoringIntervalInSeconds.",
  messages: {
    ...LmDiagnosticMessages,
    errorOccurs: paramMessage`CSharpNaming: Unexpected error occurs when checking internals or durations unit for property '${"modelName"}.${"propName"}'. You may check console or VSCode TypeSpec Output logs for more details. Error: ${"error"}`,
    unitNeeded: paramMessage`CSharpNaming: Property '${"modelName"}.${"propName"}' is for intervals or durations, but does not have a unit suffix. ${"newNameSuggestions"}`,
  },
  create: (context) => {
    return {
      modelProperty: async (property) => {
        const tk = $(context.program);
        if (property.node === undefined || property.type !== tk.builtin.duration) {
          return;
        }
        if (
          !isMyCode(property, context) ||
          isUnnamedModelProperty(property) ||
          !isDirectPropertyOfModel(property)
        ) {
          return;
        }
        const docString = getDoc(context.program, property);
        const [n, clientNameDec] = getClientNameFromDec(property, "csharp");
        const modelname = property.model ? getTypeName(property.model) : "NoModel";
        const propName = n ?? property.name;
        const description = `property '${propName}' of model '${modelname}'${
          docString ? `, description: '${docString}'` : ""
        }`;
        const renameData: RenameData = {
          originalName: propName,
          description,
        };

        try {
          const result = await aiChecker.queueDataToCheck(renameData);
          if (result.renameNeeded) {
            const suggestedNames = result.suggestedNames;
            context.reportDiagnostic({
              target: property,
              messageId: "unitNeeded",
              format: {
                modelName: property.model?.name ?? "unknown",
                propName: property.name,
                newNameSuggestions:
                  suggestedNames.length > 0
                    ? `New name suggestions: ${suggestedNames.join(", ")}`
                    : "Please append a unit suffix to the property name.",
              },
              codefixes: createRenameCodeFix(result, clientNameDec, context, property),
            });
          }
        } catch (error) {
          // TODO: handle other errors
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
