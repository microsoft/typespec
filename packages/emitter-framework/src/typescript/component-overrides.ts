import type { ObjectPropertyProps, VarDeclarationProps } from "@alloy-js/typescript";
import type {
  Enum,
  EnumMember,
  Model,
  ModelProperty,
  Scalar,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";

/** Maps TypeSpec shapes to the corresponding TypeScript declaration props. */
export type Experimental_CustomTypeToProps<TCustomType extends Type> =
  TCustomType extends ModelProperty
    ? ObjectPropertyProps
    : TCustomType extends EnumMember
      ? {}
      : TCustomType extends UnionVariant
        ? {}
        : TCustomType extends Model | Scalar | Union | Enum
          ? VarDeclarationProps
          : VarDeclarationProps | ObjectPropertyProps;
