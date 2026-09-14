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

export interface TypeSpecEntityRange {
  name: string;
  range: TypeSpecSymbolNameRange;
  nameRange: TypeSpecSymbolNameRange;
}

export function findInnermostSymbolAtOffset<T>(
  symbols: readonly T[],
  offset: number,
  getRange: (symbol: T) => TypeSpecSymbolNameRange,
  getChildren: (symbol: T) => readonly T[],
): T | undefined {
  for (const symbol of symbols) {
    const range = getRange(symbol);
    if (range.pos <= offset && offset <= range.end) {
      return (
        findInnermostSymbolAtOffset(getChildren(symbol), offset, getRange, getChildren) ?? symbol
      );
    }
  }
  return undefined;
}

export function findTypeSpecEntityAtOffset(
  source: string,
  offset: number,
): TypeSpecEntityRange | undefined {
  const script = parse(source);

  const visit = (node: Node): TypeSpecEntityRange | undefined => {
    const nameRange = getNameRange(node);
    if (nameRange && nameRange.pos <= offset && offset <= nameRange.end) {
      return {
        name: source.slice(nameRange.pos, nameRange.end),
        range: { pos: node.pos, end: node.end },
        nameRange,
      };
    }
    return visitChildren(node, visit);
  };

  return visit(script);
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
