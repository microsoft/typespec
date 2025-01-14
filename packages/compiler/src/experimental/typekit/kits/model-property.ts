import type { Enum, EnumMember, ModelProperty, Scalar, Type } from "../../../core/types.js";
import { getVisibilityForClass } from "../../../core/visibility/core.js";
import { EncodeData, getEncode, getFormat } from "../../../lib/decorators.js";
import { defineKit } from "../define-kit.js";

/** @experimental */
export interface ModelPropertyKit {
  /**
   * Check if the given `type` is a model property.
   *
   * @param type The type to check.
   */
  is(type: Type): type is ModelProperty;

  /**
   * Get the encoding of the model property or its type. The property's type
   * must be a scalar.
   *
   * @param property The model property to get the encoding for.
   */
  getEncoding(property: ModelProperty): EncodeData | undefined;

  /**
   * Get the format of the model property or its type. The property's type must
   * be a string.
   *
   * @param property The model property to get the format for.
   */
  getFormat(property: ModelProperty): string | undefined;

  /**
   * Get the visibility of the model property.
   */
  getVisibilityForClass(property: ModelProperty, visibilityClass: Enum): Set<EnumMember>;
}

interface TypeKit {
  /**
   * Utilities for working with model properties.
   *
   * For many reflection operations, the metadata being asked for may be found
   * on the model property or the type of the model property. In such cases,
   * these operations will return the metadata from the model property if it
   * exists, or the type of the model property if it exists.
   */
  modelProperty: ModelPropertyKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypeKit {}
}

defineKit<TypeKit>({
  modelProperty: {
    is(type) {
      return type.kind === "ModelProperty";
    },

    getEncoding(type) {
      return getEncode(this.program, type) ?? getEncode(this.program, type.type as Scalar);
    },

    getFormat(type) {
      return getFormat(this.program, type) ?? getFormat(this.program, type.type as Scalar);
    },

    getVisibilityForClass(property, visibilityClass) {
      return getVisibilityForClass(this.program, property, visibilityClass);
    },
  },
});
