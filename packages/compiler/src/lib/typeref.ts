import { isCompilerFeatureEnabled } from "../core/features.js";
import { reportDiagnostic } from "../core/messages.js";
import type { FunctionContext, Type } from "../core/types.js";
import type { TypeRefValue } from "../experimental/typeref.js";

export function typeref(context: FunctionContext, target: Type): TypeRefValue {
  if (!isCompilerFeatureEnabled(context.program, "typeref", context.functionCallTarget)) {
    reportDiagnostic(context.program, {
      code: "typeref-disabled",
      target: context.functionCallTarget,
    });
  }
  return {
    entityKind: "Value",
    valueKind: "TypeRefValue",
    type: context.program.checker.getTypeRefType(target),
    target,
  };
}
