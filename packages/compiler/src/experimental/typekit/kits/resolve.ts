import { Diagnostic, Type } from "../../../core/types.js";
import { createDiagnosable, Diagnosable } from "../create-diagnosable.js";
import { defineKit, Typekit } from "../define-kit.js";

/**
 * @experimental
 */
export interface ResolveKit extends Diagnosable<[reference: string], Type | undefined> {
  /**
   * Resolve a type reference string to a TypeSpec type.
   * Ignores diagnostics.
   * @param reference The type reference string (e.g., "TypeSpec.string", "MyOrg.MyLibrary.MyModel").
   * @returns The resolved Type or undefined if resolution fails.
   */
  (reference: string): Type | undefined;

  /**
   * Resolve a type reference string to a TypeSpec type, including diagnostics.
   * @param reference The type reference string (e.g., "TypeSpec.string", "MyOrg.MyLibrary.MyModel").
   * @returns A tuple containing the resolved Type (or undefined) and any diagnostics produced during resolution.
   */
  withDiagnostics(reference: string): [Type | undefined, readonly Diagnostic[]];
}

interface TypekitExtension {
  /**
   * Resolve a type reference string to a TypeSpec type.
   * @experimental
   */
  resolve: ResolveKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  resolve: createDiagnosable(function (
    this: Typekit,
    reference: string,
  ): [Type | undefined, readonly Diagnostic[]] {
    // Directly use the program's resolveTypeReference method
    return this.program.resolveTypeReference(reference);
  }),
});
