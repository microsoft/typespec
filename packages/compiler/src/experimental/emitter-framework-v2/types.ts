import type {
  ArrayModelType,
  BaseType,
  BooleanLiteral,
  Diagnostic,
  Enum,
  EnumMember,
  IntrinsicType,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "../../core/types.js";
import { ReferenceCycle } from "../../emitter-framework/reference-cycle.js";
import { EmitterOutput } from "../../emitter-framework/type-emitter.js";
import { AssetEmitter, Declaration, EmitEntity, Scope } from "../../emitter-framework/types.js";

/**
 * Represent a type that is not handled by an emitter. This is different from the actual `UnknownType` type that represent the `unknown` keyword being used as a type.
 *
 */
export interface UnhandledType extends BaseType {
  readonly kind: string;
}

export interface EmitterHooksProps<Context> {
  /** Resolved context. */
  readonly context: Readonly<Context>;
  readonly emitter: AssetEmitter<any>;
}

export interface OnUnhandledTypeProps<Context> extends EmitterHooksProps<Context> {
  readonly type: UnhandledType;
}
export interface EmitterInit<Output, Context> extends TypeHook<Output, Context> {
  /**
   * Required implementation for an emitter.
   * In the case a type is received by the emitter and it not handled this callback will be called.
   * The goal of this callback is to be able to have an emitter resilient to typespec evolution as well as helping during the development of the emitter where you might not have implemented all the types yet.
   *
   * ```ts
   *
   * const emitter = createEmitter({
   *  onUnhandledType: (type) => {
   *    return [{}, createDiagnostic({code: "unknown-type", format: {name: type.kind}})];
   *   }),
   * });
   * ```
   */
  readonly onUnhandledType: (
    param: OnUnhandledTypeProps<Context>
  ) => [Output, readonly Diagnostic[]];
}

export interface NamespaceProps<Context> extends EmitterHooksProps<Context> {
  readonly namespace: Namespace;
}
export interface ModelDeclarationProps<Context> extends EmitterHooksProps<Context> {
  readonly model: Model;
}
export interface ModelLiteralProps<Context> extends EmitterHooksProps<Context> {
  readonly model: Model & { name: "" };
}
export interface ModelInstantiationProps<Context> extends EmitterHooksProps<Context> {
  readonly model: Model;
}
export interface ArrayDeclarationProps<Context> extends EmitterHooksProps<Context> {
  readonly array: ArrayModelType;
  readonly elementType: Type;
}
export interface ArrayLiteralProps<Context> extends EmitterHooksProps<Context> {
  readonly array: ArrayModelType;
  readonly elementType: Type;
}
export interface ModelPropertyLiteralProps<Context> extends EmitterHooksProps<Context> {
  readonly property: ModelProperty;
}
export interface ModelPropertyReferenceProps<Context> extends EmitterHooksProps<Context> {
  readonly property: ModelProperty;
}
export interface BooleanLiteralProps<Context> extends EmitterHooksProps<Context> {
  readonly literal: BooleanLiteral;
}
export interface StringLiteralProps<Context> extends EmitterHooksProps<Context> {
  readonly literal: StringLiteral;
}
export interface NumericLiteralProps<Context> extends EmitterHooksProps<Context> {
  readonly literal: NumericLiteral;
}
export interface EnumDeclarationProps<Context> extends EmitterHooksProps<Context> {
  readonly enum: Enum;
}
export interface EnumMemberProps<Context> extends EmitterHooksProps<Context> {
  readonly member: EnumMember;
}
export interface EnumMemberReferenceProps<Context> extends EmitterHooksProps<Context> {
  readonly member: EnumMember;
}
export interface UnionDeclarationProps<Context> extends EmitterHooksProps<Context> {
  readonly union: Union;
}
export interface UnionLiteralProps<Context> extends EmitterHooksProps<Context> {
  readonly union: Union;
}
export interface UnionVariantProps<Context> extends EmitterHooksProps<Context> {
  readonly variant: UnionVariant;
}
export interface ScalarDeclarationProps<Context> extends EmitterHooksProps<Context> {
  readonly scalar: Scalar;
}
export interface ScalarInstantiationProps<Context> extends EmitterHooksProps<Context> {
  readonly scalar: Scalar;
}
export interface TupleLiteralProps<Context> extends EmitterHooksProps<Context> {
  readonly tuple: Tuple;
}
export interface IntrinsicProps<Context> extends EmitterHooksProps<Context> {
  readonly intrinsic: IntrinsicType;
}

export interface Foo {
  readonly reference?: (
    targetDeclaration: Declaration<Record<string, unknown>>,
    pathUp: Scope<Record<string, unknown>>[],
    pathDown: Scope<Record<string, unknown>>[],
    commonScope: Scope<Record<string, unknown>> | null
  ) => object | EmitEntity<Record<string, unknown>>; // TODO: check return type.

  readonly circularReference?: (
    target: EmitEntity<Record<string, any>>,
    scope: Scope<Record<string, any>> | undefined,
    cycle: ReferenceCycle
  ) => Record<string, any> | EmitEntity<Record<string, any>>; // TODO: check return type.
}

export interface TypeHook<Output, Context> {
  readonly namespace?: (props: NamespaceProps<Context>) => EmitterOutput<Output>;
  readonly modelDeclaration?: (props: ModelDeclarationProps<Context>) => EmitterOutput<Output>;
  readonly modelLiteral?: (props: ModelLiteralProps<Context>) => EmitterOutput<Output>;
  readonly modelInstantiation?: (props: ModelInstantiationProps<Context>) => EmitterOutput<Output>;
  readonly arrayDeclaration?: (props: ArrayDeclarationProps<Context>) => EmitterOutput<Output>;
  readonly arrayLiteral?: (props: ArrayDeclarationProps<Context>) => EmitterOutput<Output>;
  readonly modelPropertyLiteral?: (
    props: ModelPropertyLiteralProps<Context>
  ) => EmitterOutput<Output>;
  readonly modelPropertyReference?: (
    props: ModelPropertyReferenceProps<Context>
  ) => EmitterOutput<Output>;
  readonly booleanLiteral?: (props: BooleanLiteralProps<Context>) => EmitterOutput<Output>;
  readonly stringLiteral?: (props: StringLiteralProps<Context>) => EmitterOutput<Output>;
  readonly numericLiteral?: (props: NumericLiteralProps<Context>) => EmitterOutput<Output>;
  readonly enum?: (props: EnumDeclarationProps<Context>) => EmitterOutput<Output>;
  // TODO: should this be enumMemberLiteral?
  readonly enumMember?: (props: EnumMemberProps<Context>) => EmitterOutput<Output>;
  readonly enumMemberReference?: (
    props: EnumMemberReferenceProps<Context>
  ) => EmitterOutput<Output>;
  readonly unionDeclaration?: (props: UnionDeclarationProps<Context>) => EmitterOutput<Output>;
  readonly unionLiteral?: (props: UnionLiteralProps<Context>) => EmitterOutput<Output>;
  // TODO: should this be unionVariantLiteral? like modelPropertyLiteral
  readonly unionVariant?: (props: UnionVariantProps<Context>) => EmitterOutput<Output>;

  readonly scalarDeclaration?: (props: ScalarDeclarationProps<Context>) => EmitterOutput<Output>;
  readonly scalarInstantiation?: (
    props: ScalarInstantiationProps<Context>
  ) => EmitterOutput<Output>;
  readonly tupleLiteral?: (props: TupleLiteralProps<Context>) => EmitterOutput<Output>;
  readonly intrinsic?: (props: IntrinsicProps<Context>) => EmitterOutput<Output>;
}
