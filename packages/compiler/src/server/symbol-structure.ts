import { DocumentSymbol, Range, SymbolKind } from "vscode-languageserver";
import {
  EnumSpreadMemberNode,
  EnumStatementNode,
  IdentifierNode,
  InterfaceStatementNode,
  ModelSpreadPropertyNode,
  ModelStatementNode,
  Statement,
  StringLiteralNode,
  TypeSpecScriptNode,
  UnionStatementNode,
} from "../core/index.js";
import { NamespaceStatementNode, Node, SyntaxKind } from "../core/types.js";
import { isArray, isDefined } from "../utils/misc.js";

export function getSymbolStructure(ast: TypeSpecScriptNode): DocumentSymbol[] {
  const file = ast.file;

  const fileNamespace = findFileNamespace(ast);
  if (fileNamespace === undefined) {
    return getForStatements(ast.statements);
  }
  const fileNamespaceSymbol = getForNamespace(fileNamespace);
  fileNamespaceSymbol.children = getForStatements(
    ast.statements.filter((x) => x !== fileNamespace),
  );
  return [fileNamespaceSymbol];

  function findFileNamespace(ast: TypeSpecScriptNode): NamespaceStatementNode | undefined {
    const firstNamespace: NamespaceStatementNode | undefined = ast.statements.find(
      (x) => x.kind === SyntaxKind.NamespaceStatement,
    ) as any;
    if (firstNamespace === undefined) {
      return undefined;
    }
    let current = firstNamespace;
    while (
      current.statements !== undefined &&
      !isArray(current.statements) &&
      current.statements?.kind === SyntaxKind.NamespaceStatement
    ) {
      current = current.statements as any;
    }

    return current.statements === undefined ? firstNamespace : undefined;
  }

  function getDocumentSymbolsForNode(node: Node): DocumentSymbol | undefined {
    switch (node.kind) {
      case SyntaxKind.NamespaceStatement:
        return getForNamespace(node);
      case SyntaxKind.ModelStatement:
        return getForModel(node);
      case SyntaxKind.ModelProperty:
        return createDocumentSymbol(node, getName(node.id), SymbolKind.Property);
      case SyntaxKind.ModelSpreadProperty:
        return getForModelSpread(node);
      case SyntaxKind.UnionStatement:
        return getForUnion(node);
      case SyntaxKind.UnionVariant:
        return node.id === undefined
          ? undefined
          : createDocumentSymbol(node, getName(node.id), SymbolKind.EnumMember);
      case SyntaxKind.EnumStatement:
        return getForEnum(node);
      case SyntaxKind.EnumMember:
        return createDocumentSymbol(node, getName(node.id), SymbolKind.EnumMember);
      case SyntaxKind.EnumSpreadMember:
        return getForEnumSpread(node);
      case SyntaxKind.InterfaceStatement:
        return getForInterface(node);
      case SyntaxKind.OperationStatement:
        return createDocumentSymbol(node, node.id.sv, SymbolKind.Function);
      case SyntaxKind.AliasStatement:
        return createDocumentSymbol(node, node.id.sv, SymbolKind.Variable);
      default:
        return undefined;
    }
  }

  function getForStatements(statements: readonly Statement[]): DocumentSymbol[] {
    return statements.map(getDocumentSymbolsForNode).filter(isDefined);
  }

  function getForNamespace(namespace: NamespaceStatementNode): DocumentSymbol {
    const names = [namespace.id.sv];
    let current = namespace;

    while (
      current.statements !== undefined &&
      !isArray(current.statements) &&
      current.statements?.kind === SyntaxKind.NamespaceStatement
    ) {
      current = current.statements as any;
      names.push(current.id.sv);
    }

    const statementSymbols = current.statements ? getForStatements(current.statements as any) : [];
    return createDocumentSymbol(namespace, names.join("."), SymbolKind.Namespace, statementSymbols);
  }

  function createDocumentSymbol(
    node: Node,
    name: string,
    kind: SymbolKind,
    symbols?: DocumentSymbol[],
  ) {
    const start = file.getLineAndCharacterOfPosition(node.pos);
    const end = file.getLineAndCharacterOfPosition(node.end);
    const range = Range.create(start, end);
    return DocumentSymbol.create(name, undefined, kind, range, range, symbols);
  }

  function getName(id: IdentifierNode | StringLiteralNode): string {
    return id.kind === SyntaxKind.Identifier ? id.sv : id.value;
  }

  function getForModel(node: ModelStatementNode): DocumentSymbol {
    const properties: DocumentSymbol[] = [...node.properties.values()]
      .map(getDocumentSymbolsForNode)
      .filter(isDefined);
    return createDocumentSymbol(node, node.id.sv, SymbolKind.Struct, properties);
  }

  function getForModelSpread(node: ModelSpreadPropertyNode): DocumentSymbol | undefined {
    const target = node.target.target;
    if (target.kind === SyntaxKind.Identifier) {
      return createDocumentSymbol(node, target.sv, SymbolKind.Property);
    }
    return getDocumentSymbolsForNode(target);
  }

  function getForEnum(node: EnumStatementNode): DocumentSymbol {
    const members: DocumentSymbol[] = [...node.members.values()]
      .map(getDocumentSymbolsForNode)
      .filter(isDefined);
    return createDocumentSymbol(node, node.id.sv, SymbolKind.Enum, members);
  }

  function getForEnumSpread(node: EnumSpreadMemberNode): DocumentSymbol | undefined {
    const target = node.target.target;
    if (target.kind === SyntaxKind.Identifier) {
      return createDocumentSymbol(node, target.sv, SymbolKind.EnumMember);
    }
    return getDocumentSymbolsForNode(target);
  }

  function getForInterface(node: InterfaceStatementNode): DocumentSymbol {
    const operations: DocumentSymbol[] = [...node.operations.values()]
      .map(getDocumentSymbolsForNode)
      .filter(isDefined);
    return createDocumentSymbol(node, node.id.sv, SymbolKind.Interface, operations);
  }

  function getForUnion(node: UnionStatementNode): DocumentSymbol {
    const variants: DocumentSymbol[] = [...node.options.values()]
      .map(getDocumentSymbolsForNode)
      .filter(isDefined);
    return createDocumentSymbol(node, node.id.sv, SymbolKind.Enum, variants);
  }
}
