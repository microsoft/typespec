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
import { useTsp } from "../../../core/context/index.js";
import {
  type ComponentOverridesConfig,
  getOverrideForType,
  getOverridesForTypeKind,
} from "./config.js";
import { type ComponentOverridesContext, OverridesContext, useOverrides } from "./context.js";

export interface OverrideEmitPropsBase<TCustomType extends Type> {
  /**
   * The TypeSpec type to render.
   */
  type: TCustomType;

  /**
   * The default emitted output for this type.
   */
  default: Children;
}

export type CustomTypeToProps<TCustomType extends Type> = TCustomType extends ModelProperty
  ? ObjectPropertyProps
  : TCustomType extends EnumMember
    ? {}
    : TCustomType extends UnionVariant
      ? {}
      : TCustomType extends Model | Scalar | Union | Enum
        ? VarDeclarationProps
        : VarDeclarationProps | ObjectPropertyProps;

export interface OverrideReferenceProps<TCustomType extends Type>
  extends OverrideEmitPropsBase<TCustomType> {
  /**
   * The member this type is referenced from, if any. This member may contain
   * additional metadata that should be represented in the emitted output.
   */
  member?: ModelProperty;
}

export interface OverrideDeclareProps<TCustomType extends Type>
  extends OverrideEmitPropsBase<TCustomType> {
  Declaration: ComponentDefinition<CustomTypeToProps<TCustomType>>;
  declarationProps: CustomTypeToProps<TCustomType>;
}

export type OverrideDeclarationComponent<TCustomType extends Type> = ComponentDefinition<
  OverrideDeclareProps<TCustomType>
>;

export type OverrideReferenceComponent<TCustomType extends Type> = ComponentDefinition<
  OverrideReferenceProps<TCustomType>
>;

export interface ComponentOverridesConfigBase<TCustomType extends Type> {
  /** Override when this type is being declared */
  declare?: OverrideDeclarationComponent<TCustomType>;
  /**
   * Override when this type is referenced.
   * e.g. When used in <TypeExpression type={type} />
   */
  reference?: OverrideReferenceComponent<TCustomType>;
}

export interface ComponentOverridesProps {
  overrides: ComponentOverridesConfig;
  children?: Children;
}
export function ComponentOverrides(props: ComponentOverridesProps) {
  const context: ComponentOverridesContext = {
    overrides: props.overrides,
  };

  return <OverridesContext.Provider value={context}>{props.children}</OverridesContext.Provider>;
}

export interface OverrideTypeComponentCommonProps<T extends Type> {
  /**
   * The TypeSpec type to render.
   */
  type: T;

  /**
   * The default rendering.
   */
  children: Children;
}

export interface OverridableComponentDeclarationProps<
  T extends Type,
  U extends ComponentDefinition<any>,
> extends OverrideTypeComponentCommonProps<T> {
  /**
   * Pass when rendering a declaration for the provided type or type kind.
   */
  declare: true;

  /**
   * The props passed to VarDeclaration to declare this type.
   */
  declarationProps: U extends ComponentDefinition<infer P> ? P : never;

  /**
   * The component to use to declare this type.
   */
  Declaration: U;
}
export interface OverridableComponentReferenceProps<T extends Type>
  extends OverrideTypeComponentCommonProps<T> {
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

export type OverridableComponentProps<T extends Type, U extends ComponentDefinition<any>> =
  | OverridableComponentDeclarationProps<T, U>
  | OverridableComponentReferenceProps<T>;

export function OverridableComponent<T extends Type, U extends ComponentDefinition<any>>(
  props: OverridableComponentProps<T, U>,
) {
  const options = useOverrides();
  const { $ } = useTsp();
  const descriptor =
    getOverrideForType($.program, props.type, options.overrides) ??
    getOverridesForTypeKind($.program, props.type.kind, options.overrides);

  if (!descriptor) {
    return <>{props.children}</>;
  }

  if ("declare" in props && props.declare && descriptor.declare) {
    const CustomComponent = descriptor.declare;

    return (
      <CustomComponent
        type={props.type}
        default={props.children}
        declarationProps={props.declarationProps}
        Declaration={props.Declaration}
      />
    );
  } else if ("reference" in props && props.reference && descriptor.reference) {
    const CustomComponent = descriptor.reference;
    return <CustomComponent type={props.type} member={props.member} default={props.children} />;
  }

  return <>{props.children}</>;
}
