import { ignoreDiagnostics } from "../../core/diagnostics.js";
import type { Type, Union, UnionVariant } from "../../core/types.js";
import { createRekeyableMap } from "../../utils/misc.js";
import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

interface UnionDescriptor {
  /**
   * The name of the union. If name is provided, it is a union declaration.
   * Otherwise, it is a union expression.
   */
  name?: string;

  /**
   * Decorators to apply to the union.
   */
  decorators?: DecoratorArgs[];

  /**
   * The variants of the union. If a variant is a string, number, or boolean, it
   * will be converted to a union variant with the same name and type.
   */
  variants?: Record<string | symbol, string | number> | UnionVariant[];
}

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

export interface UnionKit {
  union: {
    /**
     * Create a union type.
     *
     * @param desc The descriptor of the union.
     */
    create(desc: UnionDescriptor): Union;

    /**
     * Create a union variant.
     *
     * @param desc The descriptor of the union variant.
     */
    createVariant(desc: UnionVariantDescriptor): UnionVariant;

    /**
     * Check if the given `type` is a union.
     *
     * @param type The type to check.
     */
    is(type: Type): type is Union;

    /**
     * Check if the union is a valid enum. Specifically, this checks if the
     * union has a name (since there are no enum expressions), and whether each
     * of the variant types is a valid enum member value.
     *
     * @param type The union to check.
     */
    isValidEnum(type: Union): boolean;

    /**
     * Check if a union is extensible. Extensible unions are unions which contain a variant
     * that is a supertype of all the other types. This means that the subtypes of the common
     * supertype are known example values, but others may be present.
     * @param type The union to check.
     */
    isExtensible(type: Union): boolean;
  };
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends UnionKit {}
}

export const UnionKit = defineKit<UnionKit>({
  union: {
    create(desc) {
      const union: Union = this.program.checker.createType({
        kind: "Union",
        name: desc.name,
        decorators: decoratorApplication(desc.decorators),
        variants: createRekeyableMap(),
        get options() {
          return Array.from(this.variants.values()).map((v) => v.type);
        },
        expression: desc.name === undefined,
        node: undefined as any,
      });

      if (Array.isArray(desc.variants)) {
        for (const variant of desc.variants) {
          union.variants.set(variant.name, variant);
          variant.union = union;
        }
      } else if (desc.variants) {
        for (const [name, value] of Object.entries(desc.variants)) {
          union.variants.set(
            name,
            this.union.createVariant({ name, type: this.literal.create(value) })
          );
        }
      }

      this.program.checker.finishType(union);
      return union;
    },

    createVariant(desc) {
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
      return type.kind === "Union";
    },

    isValidEnum(type) {
      for (const variant of type.variants.values()) {
        if (!this.literal.isString(variant.type) && !this.literal.isNumeric(variant.type)) {
          return false;
        }
      }

      return true;
    },

    isExtensible(type) {
      const variants = Array.from(type.variants.values());
      if (variants.length === 0) {
        return false;
      }

      for (let i = 0; i < variants.length; i++) {
        let isCommon = true;
        for (let j = 0; j < variants.length; j++) {
          if (i === j) {
            continue;
          }

          const assignable = ignoreDiagnostics(
            this.program.checker.isTypeAssignableTo(variants[j].type, variants[i].type, type)
          );

          if (!assignable) {
            isCommon = false;
            break;
          }
        }

        if (isCommon) {
          return true;
        }
      }

      return false;
    },
  },
});
