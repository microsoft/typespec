import type { FunctionContext, Type, TypeRefValue } from "../core/types.js";

/** @experimental */
export function typeref(context: FunctionContext, target: Type): TypeRefValue {
  return {
    entityKind: "Value",
    valueKind: "TypeRefValue",
    type: context.program.checker.unknownType,
    target,
  };
}
