import { compilerAssert } from "./diagnostics.js";
import { visitChildren } from "./parser.js";
import { Program } from "./program.js";
import {
  AliasStatementNode,
  CadlScriptNode,
  Declaration,
  DecoratorSymbol,
  EnumStatementNode,
  JsSourceFile,
  ModelStatementNode,
  NamespaceStatementNode,
  Node,
  OperationStatementNode,
  ScopeNode,
  Sym,
  SymbolTable,
  SyntaxKind,
  TemplateParameterDeclarationNode,
  TypeSymbol,
  UsingStatementNode,
} from "./types.js";

const SymbolTable = class extends Map<string, Sym> implements SymbolTable {
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
};

export interface Binder {
  bindSourceFile(sourceFile: CadlScriptNode): void;
  bindJsSourceFile(sourceFile: JsSourceFile): void;
  bindNode(node: Node): void;
}

export function createSymbolTable(): SymbolTable {
  return new SymbolTable();
}

export interface BinderOptions {
  // Configures the initial parent node to use when calling bindNode.  This is
  // useful for binding Cadl fragments outside the context of a full script node.
  initialParentNode?: Node;
}

export function createBinder(program: Program, options: BinderOptions = {}): Binder {
  let currentFile: CadlScriptNode;
  let parentNode: Node | undefined = options?.initialParentNode;
  let globalNamespace: NamespaceStatementNode;
  let fileNamespace: NamespaceStatementNode;
  let currentNamespace: NamespaceStatementNode;

  // Node where locals go.
  let scope: ScopeNode;

  return {
    bindSourceFile,
    bindNode,
    bindJsSourceFile,
  };

  function bindJsSourceFile(sourceFile: JsSourceFile) {
    const rootNs = sourceFile.exports["namespace"];
    const namespaces = new Set<NamespaceStatementNode>();
    for (const [key, member] of Object.entries(sourceFile.exports)) {
      if (typeof member === "function") {
        // lots of 'any' casts here because control flow narrowing `member` to Function
        // isn't particularly useful it turns out.

        if (key === "onBuild") {
          program.onBuild(member as any);
          continue;
        }

        const memberNs: string = (member as any).namespace;
        const nsParts = [];
        if (rootNs) {
          nsParts.push(...rootNs.split("."));
        }

        if (memberNs) {
          nsParts.push(...memberNs.split("."));
        }

        let currentNamespace = program.globalNamespace;
        for (const part of nsParts) {
          const existingBinding = currentNamespace.exports!.get(part);
          if (
            existingBinding &&
            existingBinding.kind === "type" &&
            namespaces.has(existingBinding.node as NamespaceStatementNode)
          ) {
            // since the namespace was "declared" as part of this source file,
            // we can simply re-use it.
            currentNamespace = existingBinding.node as NamespaceStatementNode;
          } else {
            // need to synthesize a namespace declaration node
            // consider creating a "synthetic" node flag if necessary
            const nsNode: NamespaceStatementNode = {
              kind: SyntaxKind.NamespaceStatement,
              decorators: [],
              name: { kind: SyntaxKind.Identifier, sv: key, pos: 0, end: 0 },
              pos: 0,
              end: 0,
              locals: createSymbolTable(),
              exports: createSymbolTable(),
            };

            if (existingBinding && existingBinding.kind === "type") {
              nsNode.symbol = existingBinding;

              // todo: don't merge exports
              nsNode.exports = (existingBinding.node as NamespaceStatementNode).exports;
            } else {
              declareSymbol(currentNamespace.exports!, nsNode, part);
            }

            namespaces.add(nsNode);
            currentNamespace = nsNode;
          }
        }
        const sym = createDecoratorSymbol(key, sourceFile.file.path, member);
        currentNamespace.exports!.set(sym.name, sym);
      }
    }

    sourceFile.namespaces = Array.from(namespaces);
  }

  function bindSourceFile(sourceFile: CadlScriptNode) {
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
      case SyntaxKind.AliasStatement:
        bindAliasStatement(node);
        break;
      case SyntaxKind.EnumStatement:
        bindEnumStatement(node);
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

      if (node.kind !== SyntaxKind.NamespaceStatement && node.locals) {
        program.reportDuplicateSymbols(node.locals!);
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
      case SyntaxKind.CadlScript:
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

  function bindAliasStatement(node: AliasStatementNode) {
    declareSymbol(getContainingSymbolTable(), node, node.id.sv);
    // Initialize locals for type parameters
    node.locals = new SymbolTable();
  }

  function bindEnumStatement(node: EnumStatementNode) {
    declareSymbol(getContainingSymbolTable(), node, node.id.sv);
  }

  function bindNamespaceStatement(statement: NamespaceStatementNode) {
    // check if there's an existing symbol for this namespace
    const existingBinding = currentNamespace.exports!.get(statement.name.sv);
    if (existingBinding && existingBinding.kind === "type") {
      statement.symbol = existingBinding;
      // locals are never shared.
      statement.locals = new SymbolTable();

      // todo: don't merge exports
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
      let current: CadlScriptNode | NamespaceStatementNode = statement;
      while (current.kind !== SyntaxKind.CadlScript) {
        currentFile.inScopeNamespaces.push(current);
        current = current.parent as CadlScriptNode | NamespaceStatementNode;
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
    compilerAssert(table, "Attempted to declare symbol on non-existent table");
    const symbol = createTypeSymbol(node, name);
    node.symbol = symbol;

    if (scope.kind === SyntaxKind.NamespaceStatement) {
      compilerAssert(
        node.kind !== SyntaxKind.TemplateParameterDeclaration,
        "Attempted to declare template parameter in namespace",
        node
      );

      node.namespaceSymbol = scope.symbol;
    } else if (scope.kind === SyntaxKind.CadlScript) {
      compilerAssert(
        node.kind !== SyntaxKind.TemplateParameterDeclaration,
        "Attempted to declare template parameter in global scope",
        node
      );

      node.namespaceSymbol = fileNamespace.symbol;
    }

    table.set(name, symbol);
  }
}

function hasScope(node: Node): node is ScopeNode {
  switch (node.kind) {
    case SyntaxKind.ModelStatement:
    case SyntaxKind.AliasStatement:
      return true;
    case SyntaxKind.NamespaceStatement:
      return node.statements !== undefined;
    case SyntaxKind.CadlScript:
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

function createDecoratorSymbol(name: string, path: string, value: any): DecoratorSymbol {
  return {
    kind: "decorator",
    name: `@` + name,
    path,
    value,
  };
}
