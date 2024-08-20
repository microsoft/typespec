import { isIntrinsicType } from "../../core/decorator-utils.js";
import { Scalar, Type } from "../../core/types.js";
import { defineKit } from "../define-kit.js";

export const numeric = defineKit(({ context }) => {
  return {
    /**
     * Check if type is a subtype of the numeric scalar type.
     */
    is(type: Type): type is Scalar {
      if (type.kind !== "Scalar") return false;
      return isIntrinsicType(context.program, type, "numeric");
    },

    /**
     * Check if type is the numeric scalar type and not a numeric scalar
     * subtype.
     */
    isExactly(type: Type): type is Scalar {
      return type === context.program.checker.getStdType("numeric");
    },
  };
});
