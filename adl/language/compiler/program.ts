import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { createBinder, Sym, SymbolTable } from './binder.js';
import { createChecker } from './checker.js';
import { parse } from './parser.js';
import {
  ADLScriptNode,
  IdentifierNode,
  InterfaceStatementNode,
  InterfaceType,
  ModelStatementNode,
  ModelType,
  Node,
  NumericLiteralType,
  StringLiteralType,
  SyntaxKind,
  Type
} from './types.js';

export interface Program {
  globalSymbols: SymbolTable;
  sourceFiles: Array<ADLSourceFile>;
  typeCache: WeakMap<Node, Type>;
  literalTypes: Map<string | number, StringLiteralType | NumericLiteralType>;
  onBuild(cb: (program: Program) => void): void;
}

export interface ADLSourceFile {
  ast: ADLScriptNode;
  path: string;
  symbols: SymbolTable;
  models: Array<ModelType>;
  interfaces: Array<InterfaceType>;
}

export async function compile(rootDir: string) {
  const buildCbs: any = [];

  const program: Program = {
    globalSymbols: new Map(),
    sourceFiles: [],
    typeCache: new WeakMap(),
    literalTypes: new Map(),
    onBuild(cb) {
      buildCbs.push(cb);
    },
  };

  await loadStandardLibrary(program);
  await loadDirectory(program, rootDir);
  const binder = createBinder();
  binder.bindProgram(program);
  const checker = createChecker(program);
  checker.checkProgram(program);
  await executeDecorators(program);
  buildCbs.forEach((cb: any) => cb(program));

  /**
   * Evaluation resolves identifiers and type expressions and
   * does type checking.
   */

  async function executeDecorators(program: Program) {
    for (const file of program.sourceFiles) {
      for (const stmt of file.ast.statements) {
        if (stmt.kind === SyntaxKind.ModelStatement) {
          await executeModelDecorators(stmt);
        } else if (stmt.kind === SyntaxKind.InterfaceStatement) {
          await executeInterfaceDecorators(stmt);
        }
      }
    }
  }

  async function executeInterfaceDecorators(stmt: InterfaceStatementNode) {
    const type = checker.getTypeForNode(stmt);
    for (const dec of stmt.decorators) {
      if (dec.target.kind === SyntaxKind.Identifier) {
        const decFn = await importDecorator(dec.target);
        const args = dec.arguments.map((a) =>
          toJSON(checker.getTypeForNode(a))
        );
        decFn(program, type, ...args);
      }
    }

    for (const prop of stmt.properties) {
      const type = checker.getTypeForNode(prop);
      for (const dec of prop.decorators) {
        if (dec.target.kind === SyntaxKind.Identifier) {
          const decFn = await importDecorator(dec.target);
          const args = dec.arguments.map((a) =>
            toJSON(checker.getTypeForNode(a))
          );
          decFn(program, type, ...args);
        }
      }
    }
  }

  async function executeModelDecorators(stmt: ModelStatementNode) {
    for (const dec of stmt.decorators) {
      if (dec.target.kind === SyntaxKind.Identifier) {
        const decFn = await importDecorator(dec.target);
        const type = checker.getTypeForNode(stmt);
        const args = dec.arguments.map((a) =>
          toJSON(checker.getTypeForNode(a))
        );
        decFn(program, type, ...args);
      }
    }
  }

  async function importDecorator(id: IdentifierNode) {
    const name = id.sv;
    const binding: Sym | undefined = program.globalSymbols.get(name);
    if (!binding) {
      throw new Error('Cannot find binding ' + name);
    }

    if (binding.kind !== 'decorator') {
      throw new Error('Cannot decorate using non-decorator');
    }

    const modpath = 'file:///' + join(process.cwd(), binding.path);
    const module = await import(modpath);
    return module[name];
  }

  /**
   * returns the JSON representation of a type. This is generally
   * just the raw type objects, but string and number are treated
   * specially.
   */
  function toJSON(type: Type): Type | string | number {
    if ('value' in type) {
      return (<any>type).value;
    }

    return type;
  }

  function dumpSymbols(program: Program) {
    for (const [binding, value] of program.globalSymbols) {
      console.log(`${binding} =>`);
      console.dir(value, { depth: 0 });
    }
  }

  /**
   * Binding creates symbol table entries for declared models
   * and interfaces.
   */

  function loadStandardLibrary(program: Program) {
    return loadDirectory(program, './lib');
  }

  async function loadDirectory(program: Program, rootDir: string) {
    const dir = await readdir(rootDir, { withFileTypes: true });
    for (const entry of dir) {
      if (entry.isFile()) {
        const path = join(rootDir, entry.name);
        if (entry.name.endsWith('.js')) {
          await loadJsFile(program, path);
        } else if (entry.name.endsWith('.adl')) {
          await loadAdlFile(program, path);
        }
      }
    }
  }

  async function loadAdlFile(program: Program, path: string) {
    const contents = await readFile(path, 'utf-8');
    const ast = parse(contents);
    program.sourceFiles.push({
      ast,
      path,
      interfaces: [],
      models: [],
      symbols: new Map(),
    });
  }

  async function loadJsFile(program: Program, path: string) {
    const contents = await readFile(path, 'utf-8');

    const exports = contents.match(/export function \w+/g);
    if (!exports) return;
    for (const match of exports) {
      // bind JS files early since this is the only work
      // we have to do with them.
      const name = match.match(/function (\w+)/)![1];
      program.globalSymbols.set(name, {
        kind: 'decorator',
        path,
        name,
      });
    }
  }
}

compile('./samples/appconfig').catch((e) => console.error(e));
