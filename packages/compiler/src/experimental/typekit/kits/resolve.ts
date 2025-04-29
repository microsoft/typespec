import { IndeterminateEntity, Type, Value } from "../../../core/types.js";
import { createDiagnosable, Diagnosable } from "../create-diagnosable.js";
import { defineKit } from "../define-kit.js";

export type ResolveKit = Diagnosable<
  (reference: string) => Type | Value | IndeterminateEntity | undefined
>;

interface TypekitExtension {
  /**
   * Resolve a type reference string to a TypeSpec type.
   * By default any diagnostics are ignored.
   *
   * Call `resolve.withDiagnostics("Type")` to get a tuple containing the resolved type and any diagnostics.
   *
   * @experimental
   */
  resolve: ResolveKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  resolve: createDiagnosable(function (reference) {
    return this.program.resolveTypeOrValueReference(reference);
  }),
});
