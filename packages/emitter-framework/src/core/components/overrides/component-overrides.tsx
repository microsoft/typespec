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

export interface Experimental_OverrideReferenceProps<
  TCustomType extends Type,
> extends Experimental_OverrideEmitPropsBase<TCustomType> {
  /**
   * The member this type is referenced from, if any. This member may contain
   * additional metadata that should be represented in the emitted output.
   */
  member?: ModelProperty;
}

/**
 * Fallback props type for declaration overrides.
 *
 * Declaration props are language specific (`cs.ClassDeclarationProps`, `ts.VarDeclarationProps`,
 * ...) and cannot be derived from the TypeSpec type, so they default to a permissive record.
 * Pass the concrete props type explicitly to
 * {@link Experimental_ComponentOverridesClass.forType} /
 * {@link Experimental_ComponentOverridesClass.forTypeKind} to get full type checking.
 */
export type Experimental_DefaultDeclarationProps = Record<string, any>;

export interface Experimental_OverrideDeclareProps<
  TCustomType extends Type,
  TDeclarationProps = Experimental_DefaultDeclarationProps,
> extends Experimental_OverrideEmitPropsBase<TCustomType> {
  /**
   * The component that produces the default declaration. Call it with (a modified copy of)
   * {@link declarationProps} to reuse the framework's rendering.
   */
  Declaration: ComponentDefinition<TDeclarationProps>;
  /** The props the framework would have used to render the declaration. */
  declarationProps: TDeclarationProps;
}

export type Experimental_OverrideDeclarationComponent<
  TCustomType extends Type,
  TDeclarationProps = Experimental_DefaultDeclarationProps,
> = ComponentDefinition<Experimental_OverrideDeclareProps<TCustomType, TDeclarationProps>>;

export type Experimental_OverrideReferenceComponent<TCustomType extends Type> = ComponentDefinition<
  Experimental_OverrideReferenceProps<TCustomType>
>;

export interface Experimental_ComponentOverridesConfigBase<
  TCustomType extends Type,
  TDeclarationProps = Experimental_DefaultDeclarationProps,
> {
  /**
   * Override when this type is referenced.
   * e.g. When used in <TypeExpression type={type} />
   */
  reference?: Experimental_OverrideReferenceComponent<TCustomType>;

  /**
   * Override when this type is declared.
   * e.g. When used in <ClassDeclaration type={type} />
   */
  declaration?: Experimental_OverrideDeclarationComponent<TCustomType, TDeclarationProps>;
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

export interface Experimental_OverridableComponentReferenceProps<
  T extends Type,
> extends Experimental_OverrideTypeComponentCommonProps<T> {
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

export interface Experimental_OverridableComponentDeclarationProps<
  T extends Type,
  TDeclarationProps,
> extends Experimental_OverrideTypeComponentCommonProps<T> {
  /**
   * Pass when rendering a declaration of the provided type or type kind.
   */
  declaration: true;

  /**
   * The component that produces the default declaration.
   */
  Declaration: ComponentDefinition<TDeclarationProps>;

  /**
   * The props the framework would have used to render the declaration.
   */
  declarationProps: TDeclarationProps;
}

export type Experimental_OverridableComponentProps<T extends Type, TDeclarationProps = unknown> =
  | Experimental_OverridableComponentReferenceProps<T>
  | Experimental_OverridableComponentDeclarationProps<T, TDeclarationProps>;

export function Experimental_OverridableComponent<T extends Type, TDeclarationProps = unknown>(
  props: Experimental_OverridableComponentProps<T, TDeclarationProps>,
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

  if ("declaration" in props && props.declaration && descriptor.declaration) {
    const CustomComponent = descriptor.declaration;
    return (
      <CustomComponent
        type={props.type}
        default={props.children}
        Declaration={props.Declaration}
        declarationProps={props.declarationProps}
      />
    );
  }

  return <>{props.children}</>;
}
