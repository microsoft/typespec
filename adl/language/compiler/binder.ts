import { InterfaceStatementNode, ModelStatementNode, Node, SyntaxKind } from './parser';
import { ADLSourceFile, Program } from './program';

// trying to avoid masking built-in Symbol
export type Sym = DecoratorSymbol | TypeSymbol;

export type SymbolTable = Map<string, Sym>;

export interface DecoratorSymbol {
  kind: 'decorator';
  path: string;
  name: string;
}

export interface TypeSymbol {
  kind: 'type';
  node: Node;
}

export interface Binder {
  bind(program: Program): void;
}

export function createBinder() {
  return {
    bind
  };

  function bind(program: Program) {
    for (const file of program.sourceFiles) {
      bindSourceFile(file);

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

  function bindSourceFile(file: ADLSourceFile) {
    const ast = file.ast;
    for (const statement of ast.statements) {
      switch (statement.kind) {
        case SyntaxKind.ImportStatement:
          // throw new Error("NYI");
          break;
        case SyntaxKind.ModelStatement:
        case SyntaxKind.InterfaceStatement:
          bindStatement(file, statement);
          break;
      }
    }
  }

  function bindStatement(
    file: ADLSourceFile,
    statement: ModelStatementNode | InterfaceStatementNode
  ) {
    file.symbols.set(statement.id.sv, {
      kind: 'type',
      node: statement,
    });
  }
}