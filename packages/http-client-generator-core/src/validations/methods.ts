import { getClientNameOverride } from "../decorators.js";
import { TCGCContext } from "../interfaces.js";
import { listScopedDecoratorData, overrideKey } from "../internal-utils.js";
import { reportDiagnostic } from "../lib.js";

export function validateMethods(context: TCGCContext) {
  validateClientNameNotOnOverriddenMethods(context);
}

function validateClientNameNotOnOverriddenMethods(context: TCGCContext) {
  for (const [original, override] of listScopedDecoratorData(context, overrideKey)) {
    const clientNameOverride = getClientNameOverride(context, override);
    if (clientNameOverride) {
      reportDiagnostic(context.program, {
        code: "client-name-ineffective",
        messageId: "override",
        target: override,
        format: {
          name: clientNameOverride,
          originalMethodName: original.kind === "Operation" ? original.name : "<unknown>",
        },
      });
    }
  }
}
