import { Scalar, Type } from "../../core/types.js";
import { defineKit } from "../define-kit.js";

export const scalar = defineKit(({ context }) => {
  return {
    /**
     * Check if type is a subtype of the numeric scalar type.
     */
    is(type: Type): type is Scalar {
      return type.kind === "Scalar";
    },
  };
});
