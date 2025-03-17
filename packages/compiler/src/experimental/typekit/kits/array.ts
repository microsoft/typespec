import { isArrayModelType } from "../../../core/type-utils.js";
import { Model, Type } from "../../../core/types.js";
import { defineKit } from "../define-kit.js";

/**
 * @experimental
 */
export interface ArrayKit {
  /**
   * Check if a type is an array.
   */
  is(type: Type): boolean;
  /**
   * Get the element type of an array.
   */
  getElementType(type: Model): Type;
  /**
   * Create an array type.
   */
  create(elementType: Type): Model;
}

interface TypekitExtension {
  /** @experimental */
  array: ArrayKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  array: {
    is(type) {
      return (
        type.kind === "Model" && isArrayModelType(this.program, type) && type.properties.size === 0
      );
    },
    getElementType(type) {
      if (!this.array.is(type)) {
        throw new Error("Type is not an array.");
      }
      return type.indexer!.value;
    },
    create(elementType) {
      return this.model.create({
        name: "Array",
        properties: {},
        indexer: {
          key: this.builtin.integer,
          value: elementType,
        },
      });
    },
  },
});
