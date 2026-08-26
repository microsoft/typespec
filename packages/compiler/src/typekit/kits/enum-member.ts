import type { Entity, Enum, EnumMember } from "../../core/types.js";

import { defineKit } from "../define-kit.js";
import { decoratorApplication, DecoratorArgs } from "../utils.js";

/**
 * A descriptor for creating an enum member.
 */
export interface EnumMemberDescriptor {
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

/**
 * A kit for working with enum members.
 *
 * @experimental
 * @typekit enumMember
 */
export interface EnumMemberKit {
  /**
   * Create an enum member. The enum member will be finished (i.e. decorators are run).
   */
  create(desc: EnumMemberDescriptor): EnumMember;

  /**
   * Check if `type` is an enum member type.
   *
   * @param type the type to check.
   */
  is(type: Entity): type is EnumMember;
}

interface TypekitExtension {
  enumMember: EnumMemberKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  enumMember: {
    create(desc) {
      const member: EnumMember = this.program.checker.createType({
        kind: "EnumMember",
        name: desc.name,
        value: desc.value,
        decorators: decoratorApplication(this, desc.decorators),
        enum: desc.enum as any, // initialized in enum.build if not provided here
      });
      this.program.checker.finishType(member);
      return member;
    },

    is(type) {
      return type.entityKind === "Type" && type.kind === "EnumMember";
    },
  },
});
