import type { Enum, EnumMember, Type, Union } from "../../core/types.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type UnionKit } from "./union.js";

import { createRekeyableMap } from "../../utils/misc.js";
import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

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

interface EnumMemberDescriptor {
  /**
   * The name of the enum member.
   */
  name: string;
  /**
   * Decorators to apply to the enum member.
   */
  decorators?: DecoratorArgs[];

  /**
   * The value of the enum member. If not supplied, the value will be the same
   * as the name.
   */
  value?: string | number;

  /**
   * The enum that the member belongs to. If not provided here, it is assumed
   * that it will be set in `enum.build`.
   */
  enum?: Enum;
}

interface EnumKit {
  enum: {
    /**
     * Build an enum type. The enum type will be finished (i.e. decorators are
     * run).
     */
    create(desc: EnumDescriptor): Enum;

    /**
     * Build an enum type. The enum type will be finished (i.e. decorators are
     * run).
     */
    createMember(desc: EnumMemberDescriptor): EnumMember;

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
  };
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends EnumKit {}
}

defineKit<EnumKit>({
  enum: {
    create(desc) {
      const en: Enum = this.program.checker.createType({
        kind: "Enum",
        name: desc.name,
        decorators: decoratorApplication(desc.decorators),
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
          en.members.set(name, this.enum.createMember({ name, value: member, enum: en }));
        }
      }

      this.program.checker.finishType(en);
      return en;
    },

    createMember(desc) {
      const member: EnumMember = this.program.checker.createType({
        kind: "EnumMember",
        name: desc.name,
        value: desc.value,
        decorators: decoratorApplication(desc.decorators),
        node: undefined as any,
        enum: desc.enum as any, // initialized in enum.build if not provided here
      });
      this.program.checker.finishType(member);
      return member;
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
        enumMembers.push(this.enum.createMember({ name: variant.name, value: variant.type.value }));
      }

      return this.enum.create({ name: type.name, members: enumMembers });
    },
  },
});
