import type { FunctionContext, Type, TypeRefValue } from "../core/types.js";

export function typeref(context: FunctionContext, target: Type): TypeRefValue {
  return {
    entityKind: "Value",
    valueKind: "TypeRefValue",
    type: context.program.checker.getTypeRefType(target),
    target,
  };
}
