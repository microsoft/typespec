import { createDiagnostic, Diagnostic, DiagnosticError, formatDiagnostic } from "./diagnostics.js";
import { visitChildren } from "./parser.js";
import { createProgram, Program } from "./program.js";
import {
  NamespaceStatementNode,
  ModelStatementNode,
  Node,
  SyntaxKind,
  TemplateParameterDeclarationNode,
  SourceLocation,
  Sym,
  Declaration,
  OperationStatementNode,
  ScopeNode,
  IdentifierNode,
  ADLScriptNode,
  UsingStatementNode,
} from "./types.js";
import { reportDuplicateSymbols } from "./util.js";

export class SymbolTable extends Map<string, Sym> {
  duplicates = new Set<Sym>();

  // First set for a given key wins, but record all duplicates for diagnostics.
  set(key: string, value: Sym) {
    const existing = this.get(key);
    if (existing === undefined) {
      super.set(key, value);
    } else {
      this.duplicates.add(existing);
      this.duplicates.add(value);
    }
    return this;
  }
}

export interface DecoratorSymbol {
  kind: "decorator";
  path: string;
  name: string;
  value: (...args: Array<any>) => any;
}

export interface TypeSymbol {
  kind: "type";
  node: Node;
  name: string;
}

export interface Binder {
  bindSourceFile(program: Program, sourceFile: ADLScriptNode): void;
}

export function createBinder(): Binder {
  let currentFile: ADLScriptNode;
  let parentNode: Node;
  let globalNamespace: NamespaceStatementNode;
  let fileNamespace: NamespaceStatementNode;
  let currentNamespace: NamespaceStatementNode;

  // Node where locals go.
  let scope: ScopeNode;
  return {
    bindSourceFile,
  };

  function bindSourceFile(program: Program, sourceFile: ADLScriptNode) {
    globalNamespace = program.globalNamespace;
    fileNamespace = globalNamespace;
    currentFile = sourceFile;
    currentNamespace = scope = globalNamespace;
    bindNode(sourceFile);
    currentFile.inScopeNamespaces.push(globalNamespace);
  }

  function bindNode(node: Node) {
    if (!node) return;
    // set the node's parent since we're going for a walk anyway
    node.parent = parentNode;

    switch (node.kind) {
      case SyntaxKind.ModelStatement:
        bindModelStatement(node);
        break;
      case SyntaxKind.NamespaceStatement:
        bindNamespaceStatement(node);
        break;
      case SyntaxKind.OperationStatement:
        bindOperationStatement(node);
        break;
      case SyntaxKind.TemplateParameterDeclaration:
        bindTemplateParameterDeclaration(node);
        break;
      case SyntaxKind.UsingStatement:
        bindUsingStatement(node);
        break;
    }

    const prevParent = parentNode;
    // set parent node when we walk into children
    parentNode = node;

    if (hasScope(node)) {
      const prevScope = scope;
      const prevNamespace = currentNamespace;
      scope = node;
      if (node.kind === SyntaxKind.NamespaceStatement) {
        currentNamespace = node;
      }

      visitChildren(node, bindNode);

      if (node.kind !== SyntaxKind.NamespaceStatement) {
        reportDuplicateSymbols(node.locals!);
      }

      scope = prevScope;
      currentNamespace = prevNamespace;
    } else {
      visitChildren(node, bindNode);
    }

    // restore parent node
    parentNode = prevParent;
  }

  function getContainingSymbolTable() {
    switch (scope.kind) {
      case SyntaxKind.NamespaceStatement:
        return scope.exports!;
      case SyntaxKind.ADLScript:
        return fileNamespace.exports!;
      default:
        return scope.locals!;
    }
  }

  function bindTemplateParameterDeclaration(node: TemplateParameterDeclarationNode) {
    declareSymbol(getContainingSymbolTable(), node, node.id.sv);
  }

  function bindModelStatement(node: ModelStatementNode) {
    declareSymbol(getContainingSymbolTable(), node, node.id.sv);
    // Initialize locals for type parameters
    node.locals = new SymbolTable();
  }

  function bindNamespaceStatement(statement: NamespaceStatementNode) {
    // check if there's an existing symbol for this namespace
    const existingBinding = currentNamespace.exports!.get(statement.name.sv);
    if (existingBinding && existingBinding.kind === "type") {
      statement.symbol = existingBinding;
      // locals are never shared.
      statement.locals = new SymbolTable();
      statement.exports = (existingBinding.node as NamespaceStatementNode).exports;
    } else {
      declareSymbol(getContainingSymbolTable(), statement, statement.name.sv);

      // Initialize locals for non-exported symbols
      statement.locals = new SymbolTable();

      // initialize exports for exported symbols
      statement.exports = new SymbolTable();
    }

    currentFile.namespaces.push(statement);

    if (statement.statements === undefined) {
      scope = currentNamespace = statement;
      fileNamespace = statement;
      let current: ADLScriptNode | NamespaceStatementNode = statement;
      while (current.kind !== SyntaxKind.ADLScript) {
        currentFile.inScopeNamespaces.push(current);
        current = current.parent as ADLScriptNode | NamespaceStatementNode;
      }
    }
  }

  function bindUsingStatement(statement: UsingStatementNode) {
    currentFile.usings.push(statement);
  }

  function bindOperationStatement(statement: OperationStatementNode) {
    declareSymbol(getContainingSymbolTable(), statement, statement.id.sv);
  }

  function declareSymbol(table: SymbolTable, node: Declaration, name: string) {
    if (!table) throw new Error("Attempted to declare symbol on non-existent table");
    const symbol = createTypeSymbol(node, name);
    node.symbol = symbol;

    if (scope.kind === SyntaxKind.NamespaceStatement) {
      if (node.kind === SyntaxKind.TemplateParameterDeclaration) {
        throw new Error("Attempted to declare template parameter in namespace");
      }

      node.namespaceSymbol = scope.symbol;
    } else if (scope.kind === SyntaxKind.ADLScript) {
      if (node.kind === SyntaxKind.TemplateParameterDeclaration) {
        throw new Error("Attempted to declare template parameter in global scope");
      }
      node.namespaceSymbol = fileNamespace.symbol;
    }

    table.set(name, symbol);
  }
}

function hasScope(node: Node): node is ScopeNode {
  switch (node.kind) {
    case SyntaxKind.ModelStatement:
      return true;
    case SyntaxKind.NamespaceStatement:
      return node.statements !== undefined;
    case SyntaxKind.ADLScript:
      return true;
    default:
      return false;
  }
}

function createTypeSymbol(node: Node, name: string): TypeSymbol {
  return {
    kind: "type",
    node,
    name,
  };
}
