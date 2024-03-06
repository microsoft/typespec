import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { IdentifierNode } from "../types.js";

export function createChangeIdentifierCodeFix(node: IdentifierNode, newIdentifier: string) {
  return defineCodeFix({
    id: "change-identifier",
    label: `Change ${node.sv} to ${newIdentifier}`,
    fix: (context) => {
      const location = getSourceLocation(node);
      return context.replaceText(location, newIdentifier);
    },
  });
}
