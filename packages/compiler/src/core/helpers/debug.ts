import { relative } from "path/posix";
import pc from "picocolors";
import { getSourceLocation } from "../diagnostics.js";
import { SyntaxKind, type Node } from "../types.js";

export function printNodeInfo(node: Node): string {
  const loc = getSourceLocation(node);
  const pos = loc.file.getLineAndCharacterOfPosition(loc.pos);
  const kind = pc.yellow(`[${SyntaxKind[node.kind]}]`);
  const locString = pc.cyan(
    `${relative(process.cwd(), loc.file.path)}:${pos.line + 1}:${pos.character + 1}`,
  );
  return `${kind} ${printNodeInfoInternal(node)} ${locString}`;
}

function printNodeInfoInternal(node: Node): string {
  switch (node.kind) {
    case SyntaxKind.MemberExpression:
      return `${printNodeInfoInternal(node.base)}${node.selector}${printNodeInfoInternal(node.id)}`;
    case SyntaxKind.TypeReference:
      return printNodeInfoInternal(node.target);
    case SyntaxKind.Identifier:
      return node.sv;
    case SyntaxKind.DecoratorExpression:
      return `@${printNodeInfoInternal(node.target)}`;
    default:
      return "";
  }
}
