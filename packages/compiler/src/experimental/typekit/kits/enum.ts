import type { Enum, EnumMember, Type, Union } from "../../../core/types.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type UnionKit } from "./union.js";

import { createRekeyableMap } from "../../../utils/misc.js";
import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

/**
 * Describes an enum type for creation.
 * @experimental
 */
interface EnumDescriptor {
  /**
   * The name of the enum declaration.
   */
  name: string;

  /**
   * Decorators to apply to the enum.
   */
  decorators?: DecoratorArgs[];

  /**
   * The members of the enum. If a member is an object, each property will be
   * converted to an EnumMember with the same name and value.
   */
  members?: Record<string, string | number> | EnumMember[];
}

/**
 * A kit for working with enum types.
 * @experimental
 */
export interface EnumKit {
  /**
   * Build an enum type. The enum type will be finished (i.e. decorators are
   * run).
   */
  create(desc: EnumDescriptor): Enum;

  /**
   * Build an equivalent enum from the given union. Union variants which are
   * not valid enum members are skipped. You can check if a union is a valid
   * enum with {@link UnionKit.union}'s `isEnumValue`.
   */
  createFromUnion(type: Union): Enum;

  /**
   * Check if `type` is an enum type.
   *
   * @param type the type to check.
   */
  is(type: Type): type is Enum;
}

interface TypekitExtension {
  /** @experimental */
  enum: EnumKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  enum: {
    create(desc) {
      const en: Enum = this.program.checker.createType({
        kind: "Enum",
        name: desc.name,
        decorators: decoratorApplication(this, desc.decorators),
        members: createRekeyableMap(),
        node: undefined as any,
      });

      if (Array.isArray(desc.members)) {
        for (const member of desc.members) {
          member.enum = en;
          en.members.set(member.name, member);
        }
      } else {
        for (const [name, member] of Object.entries(desc.members ?? {})) {
          en.members.set(name, this.enumMember.create({ name, value: member, enum: en }));
        }
      }

      this.program.checker.finishType(en);
      return en;
    },

    is(type) {
      return type.kind === "Enum";
    },

    createFromUnion(type) {
      if (!type.name) {
        throw new Error("Cannot create an enum from an anonymous union.");
      }

      const enumMembers: EnumMember[] = [];
      for (const variant of type.variants.values()) {
        if (
          (variant.name && typeof variant.name === "symbol") ||
          (!this.literal.isString(variant.type) && !this.literal.isNumeric(variant.type))
        ) {
          continue;
        }
        enumMembers.push(this.enumMember.create({ name: variant.name, value: variant.type.value }));
      }

      return this.enum.create({ name: type.name, members: enumMembers });
    },
  },
});
