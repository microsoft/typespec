import { isArrayModelType } from "../../../core/type-utils.js";
import { Model, Type } from "../../../core/types.js";
import { defineKit } from "../define-kit.js";

export interface ArrayKit {
    is(type: Type): type is Model;
    getElementType(type: Model): Type;
}

interface TypekitExtension {
  array: ArrayKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
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
