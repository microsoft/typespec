import { visitChildren } from './parser.js';
import { ADLSourceFile, Program } from './program.js';
import { InterfaceStatementNode, ModelStatementNode, Node, SyntaxKind, TemplateParameterDeclarationNode } from './types.js';

// trying to avoid masking built-in Symbol
export type Sym = DecoratorSymbol | TypeSymbol;

export type SymbolTable = Map<string, Sym>;

export interface DecoratorSymbol {
  kind: 'decorator';
  path: string;
  name: string;
  value: (...args: Array<any>) => any;
}

export interface TypeSymbol {
  kind: 'type';
  node: Node;
}

export interface Binder {
  bindProgram(program: Program): void;
}

export function createBinder(): Binder {
  let currentFile: ADLSourceFile;
  let parentNode: Node;

  // Node where locals go.
  let scope: Node;

  return {
    bindProgram,
  };

  function bindProgram(program: Program) {
    for (const file of program.sourceFiles) {
      currentFile = file;
      bindSourceFile();

      // everything is global
      for (const name of file.symbols.keys()) {
        if (program.globalSymbols.has(name)) {
          // todo: collect all the redeclarations of
          // this binding and mark each as errors
          throw new Error('Duplicate binding ' + name);
        }

        program.globalSymbols.set(name, file.symbols.get(name)!);
      }
    }
  }

  function bindSourceFile() {
    bindNode(currentFile.ast);
  }

  function bindNode(node: Node) {
    if (!node) return;
    // set the node's parent since we're going for a walk anyway
    (<any>node).parent = parentNode;

    switch (node.kind) {
      case SyntaxKind.ModelStatement:
        bindModelStatement(<any>node);
        break;
      case SyntaxKind.InterfaceStatement:
        bindInterfaceStatement(<any>node);
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
      kind: 'type',
      node: node,
    });
  }

  function bindModelStatement(node: ModelStatementNode) {
    currentFile.symbols.set(node.id.sv, {
      kind: 'type',
      node: node,
    });

    // initialize locals for type parameters.
    node.locals = new Map();
  }

  function bindInterfaceStatement(
    statement: InterfaceStatementNode
  ) {
    currentFile.symbols.set(statement.id.sv, {
      kind: 'type',
      node: statement,
    });
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