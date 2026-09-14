import {
  parse,
  SyntaxKind,
  visitChildren,
  type NamespaceStatementNode,
  type Node,
} from "@typespec/compiler/ast";

export interface TypeSpecSymbolNameRange {
  pos: number;
  end: number;
}

export function createTypeSpecSymbolNameRangeResolver(
  source: string,
): (pos: number, end: number) => TypeSpecSymbolNameRange | undefined {
  const ranges = new Map<string, TypeSpecSymbolNameRange>();
  const script = parse(source);

  const visit = (node: Node): void => {
    const nameRange = getNameRange(node);
    const rangeKey = getRangeKey(node.pos, node.end);
    if (nameRange && !ranges.has(rangeKey)) {
      ranges.set(rangeKey, nameRange);
    }
    visitChildren(node, visit);
  };
  visit(script);

  return (pos, end) => ranges.get(getRangeKey(pos, end));
}

function getRangeKey(pos: number, end: number): string {
  return `${pos}:${end}`;
}

function getNameRange(node: Node): TypeSpecSymbolNameRange | undefined {
  switch (node.kind) {
    case SyntaxKind.NamespaceStatement:
      return getNamespaceNameRange(node);
    case SyntaxKind.ModelStatement:
    case SyntaxKind.ModelProperty:
    case SyntaxKind.UnionStatement:
    case SyntaxKind.EnumStatement:
    case SyntaxKind.EnumMember:
    case SyntaxKind.InterfaceStatement:
    case SyntaxKind.OperationStatement:
    case SyntaxKind.AliasStatement:
      return node.id;
    case SyntaxKind.UnionVariant:
      return node.id;
    case SyntaxKind.ModelSpreadProperty:
    case SyntaxKind.EnumSpreadMember:
      return node.target.target.kind === SyntaxKind.Identifier ? node.target.target : undefined;
    default:
      return undefined;
  }
}

function getNamespaceNameRange(node: NamespaceStatementNode): TypeSpecSymbolNameRange {
  let current = node;
  while (isNamespaceStatement(current.statements)) {
    current = current.statements;
  }
  return { pos: node.id.pos, end: current.id.end };
}

function isNamespaceStatement(value: unknown): value is NamespaceStatementNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === SyntaxKind.NamespaceStatement
  );
}
