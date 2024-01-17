import type { BaseType, Diagnostic, Model, Namespace } from "../../core/types.js";
import { EmitterOutput } from "../../emitter-framework/type-emitter.js";
import { AssetEmitter } from "../../emitter-framework/types.js";

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
export interface ModelLiteralProps<Context> extends EmitterHooksProps<Context> {
  readonly model: Model;
}
export interface TypeHook<Output, Context> {
  readonly namespace?: (props: NamespaceProps<Context>) => EmitterOutput<Output>;
  readonly modelLiteral?: (props: ModelLiteralProps<Context>) => EmitterOutput<Output>;
}
