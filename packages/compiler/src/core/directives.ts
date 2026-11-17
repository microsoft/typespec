import type { Directive, DirectiveExpressionNode } from "./types.js";
import { SyntaxKind } from "./types.js";

export function parseDirective(node: DirectiveExpressionNode): Directive | undefined {
  const args = node.arguments.map((x) => {
    return x.kind === SyntaxKind.Identifier ? x.sv : x.value;
  });
  switch (node.target.sv) {
    case "suppress":
      if (typeof args[0] !== "string") {
        return undefined;
      }
      return { name: "suppress", code: args[0], message: args[1] ?? "", node };
    case "deprecated":
      if (typeof args[0] !== "string") {
        return undefined;
      }
      return { name: "deprecated", message: args[0], node };
    default:
      return undefined;
  }
}
