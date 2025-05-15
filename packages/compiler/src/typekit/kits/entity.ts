import type { Entity, Node } from "../../core/types.js";
import { createDiagnosable, Diagnosable } from "../create-diagnosable.js";
import { defineKit } from "../define-kit.js";

/**
 * Typekits for working with the top level entity.
 * @typekit entity
 */
export interface EntityKit {
  /**
   * Check if the source type can be assigned to the target.
   * @param source Source type
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic
   */
  isAssignableTo: Diagnosable<
    (source: Entity, target: Entity, diagnosticTarget?: Entity | Node) => boolean
  >;

  /**
   * Resolve a type reference string to a TypeSpec type.
   * By default any diagnostics are ignored.
   *
   * Call `resolve.withDiagnostics("Type")` to get a tuple containing the resolved type and any diagnostics.
   */
  resolve: Diagnosable<(reference: string) => Entity | undefined>;
}

interface TypekitExtension {
  entity: EntityKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  entity: {
    isAssignableTo: createDiagnosable(function (source, target, diagnosticTarget) {
      return this.program.checker.isTypeAssignableTo(source, target, diagnosticTarget ?? source);
    }),
    resolve: createDiagnosable(function (reference) {
      return this.program.resolveTypeOrValueReference(reference);
    }),
  },
});
