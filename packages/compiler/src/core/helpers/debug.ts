import { relative } from "path/posix";
import pc from "picocolors";
import { getSourceLocation } from "../diagnostics.js";
import { Sym, SymbolFlags, SyntaxKind, type Node } from "../types.js";

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

const flagsNames = [
  [SymbolFlags.Model, "Model"],
  [SymbolFlags.Scalar, "Scalar"],
  [SymbolFlags.Operation, "Operation"],
  [SymbolFlags.Enum, "Enum"],
  [SymbolFlags.Interface, "Interface"],
  [SymbolFlags.Union, "Union"],
  [SymbolFlags.Alias, "Alias"],
  [SymbolFlags.Namespace, "Namespace"],
  [SymbolFlags.Projection, "Projection"],
  [SymbolFlags.Decorator, "Decorator"],
  [SymbolFlags.TemplateParameter, "TemplateParameter"],
  [SymbolFlags.ProjectionParameter, "ProjectionParameter"],
  [SymbolFlags.Function, "Function"],
  [SymbolFlags.FunctionParameter, "FunctionParameter"],
  [SymbolFlags.Using, "Using"],
  [SymbolFlags.DuplicateUsing, "DuplicateUsing"],
  [SymbolFlags.SourceFile, "SourceFile"],
  [SymbolFlags.Member, "Member"],
  [SymbolFlags.Const, "Const"],
] as const;

export function printSymbolFlags(sym: Sym) {
  const flags: string[] = [];
  for (const [flag, name] of flagsNames) {
    if (sym.flags & flag) flags.push(name);
  }
  return flags.join(", ");
}
