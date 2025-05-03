import { isArrayModelType } from "../../core/type-utils.js";
import { ArrayModelType, Entity, Model, Type } from "../../core/types.js";
import { defineKit } from "../define-kit.js";

/**
 * Typekits for working with array types(Model with number indexer).
 * @typekit array
 */
export interface ArrayKit {
  /**
   * Check if a type is an array.
   */
  is(type: Entity): type is ArrayModelType;
  /**
   * Get the element type of an array.
   */
  getElementType(type: Model): Type;
  /**
   * Create an array type.
   */
  create(elementType: Type): ArrayModelType;
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
      return (
        type.entityKind === "Type" &&
        type.kind === "Model" &&
        isArrayModelType(this.program, type) &&
        type.properties.size === 0
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
      }) as ArrayModelType;
    },
  },
});
