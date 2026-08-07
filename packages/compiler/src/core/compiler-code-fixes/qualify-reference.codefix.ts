import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { typeReferenceToString } from "../helpers/syntax-utils.js";
import type { IdentifierNode, MemberExpressionNode } from "../types.js";

/** Codefix replacing a reference with its fully qualified name. */
export function createQualifyReferenceCodeFix(
  node: IdentifierNode | MemberExpressionNode,
  fullyQualifiedName: string,
) {
  return defineCodeFix({
    id: "qualify-reference",
    label: `Change ${typeReferenceToString(node)} to ${fullyQualifiedName}`,
    fix: (context) => {
      return context.replaceText(getSourceLocation(node), fullyQualifiedName);
    },
  });
}
