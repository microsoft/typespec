import { relative } from "path/posix";
import pc from "picocolors";
import { getSourceLocation } from "../diagnostics.js";
import {
  IdentifierNode,
  MemberExpressionNode,
  SyntaxKind,
  TypeReferenceNode,
  type Node,
} from "../types.js";

/** @internal */
export function inspectNode(node: Node): string {
  const loc = getSourceLocation(node);
  const pos = loc.file.getLineAndCharacterOfPosition(loc.pos);
  const kind = pc.yellow(`[${SyntaxKind[node.kind]}]`);
  const locString = pc.cyan(
    `${relative(process.cwd(), loc.file.path)}:${pos.line + 1}:${pos.character + 1}`,
  );
  return `${kind} ${printNodeInfoInternal(node)} ${locString}`;
}

export function typeReferenceToString(
  node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
) {
  switch (node.kind) {
    case SyntaxKind.MemberExpression:
      return `${printNodeInfoInternal(node.base)}${node.selector}${printNodeInfoInternal(node.id)}`;
    case SyntaxKind.TypeReference:
      return printNodeInfoInternal(node.target);
    case SyntaxKind.Identifier:
      return node.sv;
  }
}
function printNodeInfoInternal(node: Node): string {
  switch (node.kind) {
    case SyntaxKind.MemberExpression:
    case SyntaxKind.TypeReference:
    case SyntaxKind.Identifier:
      return typeReferenceToString(node);
    case SyntaxKind.DecoratorExpression:
      return `@${printNodeInfoInternal(node.target)}`;
    case SyntaxKind.JsNamespaceDeclaration:
    case SyntaxKind.NamespaceStatement:
    case SyntaxKind.ModelStatement:
    case SyntaxKind.OperationStatement:
    case SyntaxKind.EnumStatement:
    case SyntaxKind.AliasStatement:
    case SyntaxKind.ConstStatement:
    case SyntaxKind.UnionStatement:
      return node.id.sv;
    default:
      return "";
  }
}
