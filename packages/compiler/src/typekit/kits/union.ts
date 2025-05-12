import { ignoreDiagnostics } from "../../core/diagnostics.js";
import {
  DiscriminatedUnion,
  getDiscriminatedUnion,
} from "../../core/helpers/discriminator-utils.js";
import type { Entity, Enum, Type, Union, UnionVariant } from "../../core/types.js";
import { $doc, getDoc } from "../../lib/decorators.js";
import { createRekeyableMap } from "../../utils/misc.js";
import { createDiagnosable, Diagnosable } from "../create-diagnosable.js";
import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

/**
 * A descriptor for a union type.
 */
export interface UnionDescriptor {
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

/**
 * Utilities for working with unions.
 * @typekit union
 */
export interface UnionKit {
  /**
   * Creates a union type with filtered variants.
   * @param filterFn Function to filter the union variants
   */
  filter(union: Union, filterFn: (variant: UnionVariant) => boolean): Union;
  /**
   * Create a union type.
   *
   * @param desc The descriptor of the union.
   */
  create(desc: UnionDescriptor): Union;
  /**
   * Create an anonymous union type from an array of types.
   *
   * @param children The types to create a union from.
   *
   * Any API documentation will be rendered and preserved in the resulting union.
   *
   * No other decorators are copied from the enum to the union.
   */
  create(children: Type[]): Union;

  /**
   * Creates a union type from an enum.
   *
   * @remarks
   *
   * @param type The enum to create a union from.
   *
   * For member without an explicit value, the member name is used as the value.
   *
   * Any API documentation will be rendered and preserved in the resulting union.
   *
   * No other decorators are copied from the enum to the union.
   */
  createFromEnum(type: Enum): Union;

  /**
   * Check if the given `type` is a union.
   *
   * @param type The type to check.
   */
  is(type: Entity): type is Union;

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

  /**
   * Checks if an union is an expression (anonymous) or declared.
   * @param type Uniton to check if it is an expression
   */
  isExpression(type: Union): boolean;
  /**
   * Resolves a discriminated union for the given union.
   * @param type Union to resolve the discriminated union for.
   */
  getDiscriminatedUnion: Diagnosable<(type: Union) => DiscriminatedUnion | undefined>;
}

interface TypekitExtension {
  /**
   * Utilities for working with unions.
   */
  union: UnionKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

export const UnionKit = defineKit<TypekitExtension>({
  union: {
    filter(union, filterFn) {
      const variants = Array.from(union.variants.values()).filter(filterFn);
      return this.union.create({ variants });
    },
    create(descOrChildren: UnionDescriptor | Type[]) {
      let descriptor: UnionDescriptor;
      if (Array.isArray(descOrChildren)) {
        // Build a descriptor from the children
        descriptor = {
          decorators: [],
          variants: descOrChildren.map((child) => {
            const memberDoc = getDoc(this.program, child);
            return this.unionVariant.create({
              type: child,
              decorators: memberDoc ? [[$doc, memberDoc]] : undefined,
            });
          }),
        };
      } else {
        // Already a descriptor
        descriptor = descOrChildren;
      }

      const union: Union = this.program.checker.createType({
        kind: "Union",
        name: descriptor.name,
        decorators: decoratorApplication(this, descriptor.decorators),
        variants: createRekeyableMap(),
        get options() {
          return Array.from(this.variants.values()).map((v) => v.type);
        },
        expression: descriptor.name === undefined,
      });

      if (Array.isArray(descriptor.variants)) {
        for (const variant of descriptor.variants) {
          union.variants.set(variant.name, variant);
          variant.union = union;
        }
      } else if (descriptor.variants) {
        for (const [name, value] of Object.entries(descriptor.variants)) {
          union.variants.set(
            name,
            this.unionVariant.create({ name, type: this.literal.create(value) }),
          );
        }
      }

      this.program.checker.finishType(union);
      return union;
    },
    createFromEnum(type) {
      const enumDoc = getDoc(this.program, type);
      return this.union.create({
        name: type.name,
        decorators: enumDoc ? [[$doc, enumDoc]] : undefined,
        variants: Array.from(type.members.values()).map((member) => {
          const memberDoc = getDoc(this.program, member);
          const value = member.value ?? member.name;

          return this.unionVariant.create({
            name: member.name,
            type: this.literal.create(value),
            decorators: memberDoc ? [[$doc, memberDoc]] : undefined,
          });
        }),
      });
    },

    is(type) {
      return type.entityKind === "Type" && type.kind === "Union";
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
            this.program.checker.isTypeAssignableTo(variants[j].type, variants[i].type, type),
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

    isExpression(type) {
      return type.name === undefined || type.name === "";
    },
    getDiscriminatedUnion: createDiagnosable(function (type) {
      return getDiscriminatedUnion(this.program, type);
    }),
  },
});
