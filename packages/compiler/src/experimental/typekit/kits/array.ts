import { isArrayModelType } from "../../../core/type-utils.js";
import { Model, Type } from "../../../core/types.js";
import { defineKit } from "../define-kit.js";

export interface ArrayKit {
  array: {
    /**
     * Check if the given `type` is an Array.
     *
     * @param type The type to check.
     */
    is(type: Type): type is Model;
    getElementType(type: Model): Type;
  };
}

declare module "../define-kit.js" {
  interface Typekit extends ArrayKit {}
}

defineKit<ArrayKit>({
  array: {
    is(type) {
      return type.kind === "Model" && isArrayModelType(this.program, type);
    },
    getElementType(type) {
      if (!this.array.is(type)) {
        throw new Error("Type is not an array.");
      }
      return type.indexer!.value;
    },
  },
});
