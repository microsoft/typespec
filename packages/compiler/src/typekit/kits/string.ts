import { isIntrinsicType } from "../../core/decorator-utils.js";
import { Scalar, Type } from "../../core/types.js";
import { defineKit } from "../define-kit.js";

export const string = defineKit(({ context }) => {
  return {
    is(type: Type) {
      if (type.kind !== "Scalar") return false;
      return isIntrinsicType(context.program, type, "string");
    },
    isExactly(type: Type): type is Scalar {
      return type === context.program.checker.getStdType("string");
    },
  };
});
