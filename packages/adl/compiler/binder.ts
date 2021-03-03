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

  // Node where locals go.
  let scope: Node;

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
        bindModelStatement(<any>node);
        break;
      case SyntaxKind.NamespaceStatement:
        bindNamespaceStatement(<any>node);
        break;
      case SyntaxKind.TemplateParameterDeclaration:
        bindTemplateParameterDeclaration(<any>node);
    }

    const prevParent = parentNode;
    // set parent node when we walk into children
    parentNode = node;

    if (hasScope(node)) {
      const prevScope = scope;
      scope = node;
      visitChildren(node, bindNode);
      scope = prevScope;
    } else {
      visitChildren(node, bindNode);
    }

    // restore parent node
    parentNode = prevParent;
  }

  function bindTemplateParameterDeclaration(node: TemplateParameterDeclarationNode) {
    (<ModelStatementNode>scope).locals!.set(node.sv, {
      kind: "type",
      node: node,
      name: node.sv,
    });
  }

  function bindModelStatement(node: ModelStatementNode) {
    declareSymbol(currentFile.symbols, node);
    // initialize locals for type parameters.
    node.locals = new SymbolTable();
  }

  function bindNamespaceStatement(statement: NamespaceStatementNode) {
    declareSymbol(currentFile.symbols, statement);
  }

  function reportDuplicateSymbols(globalSymbols: SymbolTable) {
    let reported = new Set<Sym>();
    let messages = new Array<string>();

    for (const symbol of currentFile.symbols.duplicates) {
      report(symbol);
    }

    for (const symbol of globalSymbols.duplicates) {
      report(symbol);
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

function hasScope(node: Node) {
  switch (node.kind) {
    case SyntaxKind.ModelStatement:
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

function declareSymbol(table: SymbolTable, node: Declaration) {
  const symbol = createTypeSymbol(node, node.id.sv);
  node.symbol = symbol;
  table.set(node.id.sv, symbol);
}
