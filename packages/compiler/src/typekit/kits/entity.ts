import type { Entity, Node } from "../../core/types.js";
import { createDiagnosable, Diagnosable } from "../create-diagnosable.js";
import { defineKit } from "../define-kit.js";

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
}

interface TypekitExtension {
  /** @experimental */
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
  },
});
