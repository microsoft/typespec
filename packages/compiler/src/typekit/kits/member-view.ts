import type { EnumMember, ModelProperty, Scalar, Type, UnionVariant } from "../../core/types.js";
import { EncodeData, getEncode } from "../../lib/decorators.js";
import { $, defineKit } from "../define-kit.js";

interface MemberView<
  TMember extends ModelProperty | EnumMember | UnionVariant,
  TValue extends Type | undefined,
> {
  member: TMember;
  type: TValue;
}

interface MemberViewKit {
  memberView: {
    create<TMember extends ModelProperty | EnumMember | UnionVariant>(
      member: TMember
    ): MemberView<
      TMember,
      TMember extends ModelProperty | UnionVariant ? TMember["type"] : undefined
    >;

    /**
     * Get the encoding of a model property view. The property's type must be a scalar.
     *
     * @param view The view to get the encoding of.
     * @returns The encoding metadata.
     */
    getEncoding(memberView: MemberView<ModelProperty, Scalar>): EncodeData | undefined;

    /**
     * Check that the given view's type is of a certain type.
     *
     * @param view The view to check.
     */
    typeIs<
      TMember extends ModelProperty | EnumMember | UnionVariant,
      TValue extends Type | undefined,
      V extends TValue,
    >(
      view: MemberView<TMember, TValue>,
      predicate: (type: TValue) => type is V
    ): view is MemberView<TMember, V>;
  };
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends MemberViewKit {}
}

defineKit<MemberViewKit>({
  memberView: {
    create(member) {
      return {
        member,
        type: $.modelProperty.is(member)
          ? member.type
          : $.unionVariant.is(member)
            ? member.type
            : undefined,
      };
    },

    getEncoding(view) {
      if (!validateView(view, $.modelProperty.is, $.scalar.is)) {
        throw new Error("Expected a model property view with a scalar type.");
      }

      return applyToView(view, (type) => getEncode(this.program, type));
    },

    typeIs(view, predicate) {
      return true;
    },
  },
});

function validateView<
  T extends ModelProperty | EnumMember | UnionVariant,
  U extends Type | undefined,
>(
  view: MemberView<T, U>,
  memberPredicates: (type: T) => boolean,
  valuePredicates: (type: U) => boolean
) {
  return memberPredicates(view.member) && view.type ? valuePredicates(view.type) : true;
}

function applyToView<
  T extends ModelProperty | EnumMember | UnionVariant,
  U extends Type | undefined,
  V,
>(view: MemberView<T, U>, cb: (type: T | U) => V): V | undefined {
  return cb(view.member) ?? (view.type ? cb(view.type) : undefined);
}
