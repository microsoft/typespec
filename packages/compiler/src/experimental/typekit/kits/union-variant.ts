import type { Type, Union, UnionVariant } from "../../../core/types.js";
import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

interface UnionVariantDescriptor {
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

export interface UnionVariantKit {
  unionVariant: {
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
    is(type: Type): type is UnionVariant;
  };
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends UnionVariantKit {}
}

defineKit<UnionVariantKit>({
  unionVariant: {
    create(desc) {
      const variant: UnionVariant = this.program.checker.createType({
        kind: "UnionVariant",
        name: desc.name ?? Symbol("name"),
        decorators: decoratorApplication(desc.decorators),
        type: desc.type,
        node: undefined as any,
        union: desc.union as any,
      });
      this.program.checker.finishType(variant);
      return variant;
    },

    is(type) {
      return type.kind === "UnionVariant";
    },
  },
});
