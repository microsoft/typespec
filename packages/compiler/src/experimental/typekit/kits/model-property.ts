import type { ModelProperty, Scalar, Type } from "../../../core/types.js";
import { EncodeData, getEncode, getFormat, getVisibility } from "../../../lib/decorators.js";
import { defineKit } from "../define-kit.js";

export interface ModelPropertyDescriptor {
  /**
   * The name of the model property.
   */
  name: string;

  /**
   * The type of the model property.
   */
  type: Type;

  /**
   * Whether the model property is optional.
   */
  optional?: boolean;
}

export interface ModelPropertyKit {
  /**
   * Creates a modelProperty type.
   * @param desc The descriptor of the model property.
   */
  create(desc: ModelPropertyDescriptor): ModelProperty;
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

  // todo: update this with Will's proposal.
  /**
   * Get the visibility of the model property.
   */
  getVisibility(property: ModelProperty): string[] | undefined;
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
  interface TypekitPrototype extends TypeKit {}
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

    getVisibility(property) {
      return getVisibility(this.program, property);
    },
    create(desc) {
      return this.program.checker.createType({
        kind: "ModelProperty",
        name: desc.name,
        node: undefined as any,
        type: desc.type,
        optional: desc.optional ?? false,
        decorators: [],
      });
    },
  },
});
