import { DiagnosticError, formatDiagnostic } from "./diagnostics.js";
import { visitChildren } from "./parser.js";
import { ADLSourceFile, Program } from "./program.js";
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
} from "./types.js";

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
  bindSourceFile(program: Program, sourceFile: ADLSourceFile, globalScope: boolean): void;
}

export function createBinder(): Binder {
  let currentFile: ADLSourceFile;
  let parentNode: Node;

  let currentNamespace: NamespaceStatementNode | undefined;

  // Node where locals go.
  let scope: ScopeNode;
  return {
    bindSourceFile,
  };

  function bindSourceFile(
    program: Program,
    sourceFile: ADLSourceFile,
    globalScope: boolean = false
  ) {
    currentFile = sourceFile;
    bindNode(sourceFile.ast);
    reportDuplicateSymbols(currentFile.symbols);

    // everything is global
    if (globalScope) {
      for (const [name, sym] of sourceFile.symbols) {
        program.globalSymbols.set(name, sym);
      }
      reportDuplicateSymbols(program.globalSymbols);
    }
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

      scope = prevScope;
      currentNamespace = prevNamespace;
    } else {
      visitChildren(node, bindNode);
    }

    // restore parent node
    parentNode = prevParent;
  }

  function getContainingSymbolTable() {
    return scope ? scope.locals! : currentFile.symbols;
  }

  function bindTemplateParameterDeclaration(node: TemplateParameterDeclarationNode) {
    declareSymbol(getContainingSymbolTable(), node);
  }

  function bindModelStatement(node: ModelStatementNode) {
    declareSymbol(getContainingSymbolTable(), node);

    // Initialize locals for type parameters
    node.locals = new SymbolTable();
  }

  function bindNamespaceStatement(statement: NamespaceStatementNode) {
    declareSymbol(getContainingSymbolTable(), statement);

    // Initialize locals for namespace members
    statement.locals = new SymbolTable();
  }

  function bindOperationStatement(statement: OperationStatementNode) {
    declareSymbol(getContainingSymbolTable(), statement);
  }

  function declareSymbol(table: SymbolTable, node: Declaration) {
    const symbol = createTypeSymbol(node, node.id.sv);
    node.symbol = symbol;
    if (currentNamespace && node.kind !== SyntaxKind.TemplateParameterDeclaration) {
      node.namespaceSymbol = currentNamespace.symbol;
    }
    table.set(node.id.sv, symbol);
  }

  function reportDuplicateSymbols(symbols: SymbolTable) {
    let reported = new Set<Sym>();
    let messages = new Array<string>();

    for (const symbol of currentFile.symbols.duplicates) {
      report(symbol);
    }

    for (const symbol of symbols.duplicates) {
      report(symbol);
    }

    // Check symbols that have their own scopes
    for (const [_, symbol] of symbols) {
      if (symbol.kind === "type" && hasScope(symbol.node) && symbol.node.locals) {
        reportDuplicateSymbols(symbol.node.locals);
      }
    }

    if (messages.length > 0) {
      // TODO: We're now reporting all duplicates up to the binding of the first file
      // that introduced one, but still bailing the compilation rather than
      // recovering and reporting other issues including the possibility of more
      // duplicates.
      //
      // That said, decorators are entered into the global symbol table before
      // any source file is bound and therefore this will include all duplicate
      // decorator implementations.

      throw new DiagnosticError(messages.join("\n"));
    }

    function report(symbol: Sym) {
      if (!reported.has(symbol)) {
        reported.add(symbol);
        const message = formatDiagnostic("Duplicate name: " + symbol.name, symbol);
        messages.push(message);
      }
    }
  }
}

function hasScope(node: Node): node is ScopeNode {
  switch (node.kind) {
    case SyntaxKind.ModelStatement:
      return true;
    case SyntaxKind.NamespaceStatement:
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
