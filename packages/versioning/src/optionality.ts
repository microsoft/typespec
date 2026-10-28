import type { ModelProperty } from "@typespec/compiler";
import { SyntaxKind } from "@typespec/compiler/ast";

export function hasChangedOptionality(property: ModelProperty): boolean {
  return (
    property.node?.kind === SyntaxKind.ModelProperty && property.optional !== property.node.optional
  );
}
