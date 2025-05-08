import type { Entity, Type, Union, UnionVariant } from "../../core/types.js";
import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

/**
 * A descriptor for a union variant.
 */
export interface UnionVariantDescriptor {
  /**
   * The name of the union variant.
   */
  name?: string | symbol;

  /**
   * Decorators to apply to the union variant.
   */
  decorators?: DecoratorArgs[];

  /**
   * The type of the union variant.
   */
  type: Type;

  /**
   * The union that the variant belongs to. If not provided here, it is assumed
   * that it will be set in `union.build`.
   */
  union?: Union;
}

/**
 * Utilities for working with union variants.
 *
 * Union variants are types that represent a single value within a union that can be one of
 * several types.
 *
 * @typekit unionVariant
 */
export interface UnionVariantKit {
  /**
   * Create a union variant.
   *
   * @param desc The descriptor of the union variant.
   */
  create(desc: UnionVariantDescriptor): UnionVariant;

  /**
   * Check if the given `type` is a union.
   *
   * @param type The type to check.
   */
  is(type: Entity): type is UnionVariant;
}

interface TypekitExtension {
  /**
   * Utilities for working with union variants.
   */
  unionVariant: UnionVariantKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  unionVariant: {
    create(desc) {
      const variant: UnionVariant = this.program.checker.createType({
        kind: "UnionVariant",
        name: desc.name ?? Symbol("name"),
        decorators: decoratorApplication(this, desc.decorators),
        type: desc.type,
        union: desc.union as any,
      });
      this.program.checker.finishType(variant);
      return variant;
    },

    is(type) {
      return type.entityKind === "Type" && type.kind === "UnionVariant";
    },
  },
});
