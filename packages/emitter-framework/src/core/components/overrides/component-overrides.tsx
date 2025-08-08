import { type Children, type ComponentDefinition } from "@alloy-js/core";
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
import { useTsp } from "../../context/index.js";
import {
  type Experimental_ComponentOverridesConfig,
  getOverrideForType,
  getOverridesForTypeKind,
} from "./config.js";
import { type ComponentOverridesContext, OverridesContext, useOverrides } from "./context.js";

export interface Experimental_OverrideEmitPropsBase<TCustomType extends Type> {
  /**
   * The TypeSpec type to render.
   */
  type: TCustomType;

  /**
   * The default emitted output for this type.
   */
  default: Children;
}

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

export interface Experimental_OverrideReferenceProps<TCustomType extends Type>
  extends Experimental_OverrideEmitPropsBase<TCustomType> {
  /**
   * The member this type is referenced from, if any. This member may contain
   * additional metadata that should be represented in the emitted output.
   */
  member?: ModelProperty;
}

export interface Experimental_OverrideDeclareProps<TCustomType extends Type>
  extends Experimental_OverrideEmitPropsBase<TCustomType> {
  Declaration: ComponentDefinition<Experimental_CustomTypeToProps<TCustomType>>;
  declarationProps: Experimental_CustomTypeToProps<TCustomType>;
}

export type Experimental_OverrideDeclarationComponent<TCustomType extends Type> =
  ComponentDefinition<Experimental_OverrideDeclareProps<TCustomType>>;

export type Experimental_OverrideReferenceComponent<TCustomType extends Type> = ComponentDefinition<
  Experimental_OverrideReferenceProps<TCustomType>
>;

export interface Experimental_ComponentOverridesConfigBase<TCustomType extends Type> {
  /**
   * Override when this type is referenced.
   * e.g. When used in <TypeExpression type={type} />
   */
  reference?: Experimental_OverrideReferenceComponent<TCustomType>;
}

export interface Experimental_ComponentOverridesProps {
  overrides: Experimental_ComponentOverridesConfig;
  children?: Children;
}
export function Experimental_ComponentOverrides(props: Experimental_ComponentOverridesProps) {
  const context: ComponentOverridesContext = {
    overrides: props.overrides,
  };

  return <OverridesContext.Provider value={context}>{props.children}</OverridesContext.Provider>;
}

export interface Experimental_OverrideTypeComponentCommonProps<T extends Type> {
  /**
   * The TypeSpec type to render.
   */
  type: T;

  /**
   * The default rendering.
   */
  children: Children;
}

export interface Experimental_OverridableComponentReferenceProps<T extends Type>
  extends Experimental_OverrideTypeComponentCommonProps<T> {
  /**
   * Pass when rendering a reference to the provided type or type kind.
   */
  reference: true;

  /**
   * The member this type is referenced from, if any. This member may contain
   * additional metadata that should be represented in the emitted output.
   */
  member?: ModelProperty;
}

export type Experimental_OverridableComponentProps<T extends Type> =
  Experimental_OverridableComponentReferenceProps<T>;

export function Experimental_OverridableComponent<T extends Type>(
  props: Experimental_OverridableComponentProps<T>,
) {
  const options = useOverrides();
  const { $ } = useTsp();
  const descriptor =
    getOverrideForType($.program, props.type, options.overrides) ??
    getOverridesForTypeKind($.program, props.type.kind, options.overrides);

  if (!descriptor) {
    return <>{props.children}</>;
  }

  if ("reference" in props && props.reference && descriptor.reference) {
    const CustomComponent = descriptor.reference;
    return <CustomComponent type={props.type} member={props.member} default={props.children} />;
  }

  return <>{props.children}</>;
}
