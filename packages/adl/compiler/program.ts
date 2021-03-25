import { resolve } from "path";
import { lstat } from "fs/promises";
import { join } from "path";
import { createBinder, SymbolTable } from "./binder.js";
import { createChecker, MultiKeyMap } from "./checker.js";
import { CompilerOptions } from "./options.js";
import { parse } from "./parser.js";
import {
  ADLScriptNode,
  DecoratorExpressionNode,
  IdentifierNode,
  NamespaceType,
  LiteralType,
  ModelStatementNode,
  ModelType,
  SyntaxKind,
  Type,
  SourceFile,
  DecoratorSymbol,
  CompilerHost,
  NamespaceStatementNode,
} from "./types.js";
import { createSourceFile, throwDiagnostic } from "./diagnostics.js";

export interface Program {
  compilerOptions: CompilerOptions;
  globalNamespace: NamespaceStatementNode;
  sourceFiles: Array<ADLSourceFile>;
  typeCache: MultiKeyMap<Type>;
  literalTypes: Map<string | number | boolean, LiteralType>;
  checker?: ReturnType<typeof createChecker>;
  evalAdlScript(adlScript: string, filePath?: string): void;
  onBuild(cb: (program: Program) => void): void;
  executeModelDecorators(type: ModelType): void;
  executeDecorators(type: Type): void;
  executeDecorator(node: DecoratorExpressionNode, program: Program, type: Type): void;
}

export interface ADLSourceFile extends SourceFile {
  ast: ADLScriptNode;
  models: Array<ModelType>;
  interfaces: Array<NamespaceType>;
  namespaces: NamespaceStatementNode[]; // list of namespaces in this file (initialized during binding)
}

export async function createProgram(
  host: CompilerHost,
  options: CompilerOptions
): Promise<Program> {
  const buildCbs: any = [];

  const program: Program = {
    compilerOptions: options || {},
    globalNamespace: createGlobalNamespace(),
    sourceFiles: [],
    typeCache: new MultiKeyMap(),
    literalTypes: new Map(),
    evalAdlScript,
    executeModelDecorators,
    executeDecorators,
    executeDecorator,
    onBuild(cb) {
      buildCbs.push(cb);
    },
  };

  let virtualFileCount = 0;
  const binder = createBinder();

  if (!options?.nostdlib) {
    await loadStandardLibrary(program);
  }

  await loadMain(options);

  const checker = (program.checker = createChecker(program));
  program.checker.checkProgram(program);
  buildCbs.forEach((cb: any) => cb(program));

  return program;

  function createGlobalNamespace(): NamespaceStatementNode {
    const nsId: IdentifierNode = {
      kind: SyntaxKind.Identifier,
      pos: 0,
      end: 0,
      sv: "__GLOBAL_NS",
    };

    return {
      kind: SyntaxKind.NamespaceStatement,
      decorators: [],
      pos: 0,
      end: 0,
      name: nsId,
      locals: new SymbolTable(),
      exports: new SymbolTable(),
    };
  }

  function executeModelDecorators(type: ModelType) {
    const stmt = <ModelStatementNode>(type.templateNode || type.node);

    for (const dec of stmt.decorators) {
      executeDecorator(dec, program, type);
    }

    if (stmt.properties) {
      for (const [name, propType] of type.properties) {
        const propNode = propType.node;

        if ("decorators" in propNode) {
          for (const dec of propNode.decorators) {
            executeDecorator(dec, program, propType);
          }
        }
      }
    }
  }

  function executeDecorators(type: Type) {
    if ((<any>type.node).decorators) {
      for (const dec of (<any>type.node).decorators) {
        executeDecorator(dec, program, type);
      }
    }
  }

  function executeDecorator(dec: DecoratorExpressionNode, program: Program, type: Type) {
    if (dec.target.kind !== SyntaxKind.Identifier) {
      throwDiagnostic("Decorator must be identifier", dec);
    }

    const decName = dec.target.sv;
    const args = dec.arguments.map((a) => toJSON(checker.getTypeForNode(a)));
    const decBinding = <DecoratorSymbol>program.globalNamespace.locals!.get(decName);
    if (!decBinding) {
      throwDiagnostic(`Can't find decorator ${decName}`, dec);
    }
    const decFn = decBinding.value;
    decFn(program, type, ...args);
  }

  /**
   * returns the JSON representation of a type. This is generally
   * just the raw type objects, but string and number literals are
   * treated specially.
   */
  function toJSON(type: Type): Type | string | number {
    if ("value" in type) {
      return (<any>type).value;
    }

    return type;
  }

  async function loadStandardLibrary(program: Program) {
    for (const dir of host.getLibDirs()) {
      await loadDirectory(program, dir);
    }
  }

  async function loadDirectory(program: Program, rootDir: string) {
    const dir = await host.readDir(rootDir);
    for (const entry of dir) {
      if (entry.isFile()) {
        const path = join(rootDir, entry.name);
        if (entry.name.endsWith(".js")) {
          await loadJsFile(program, path);
        } else if (entry.name.endsWith(".adl")) {
          await loadAdlFile(program, path);
        }
      }
    }
  }

  async function loadAdlFile(program: Program, path: string) {
    const contents = await host.readFile(path);
    if (!contents) {
      throw new Error("Couldn't load ADL file " + path);
    }
    program.evalAdlScript(contents, path);
  }

  async function loadJsFile(program: Program, path: string) {
    const exports = await host.getJsImport(path);

    for (const match of Object.keys(exports)) {
      // bind JS files early since this is the only work
      // we have to do with them.
      const value = exports[match];

      if (match === "onBuild") {
        program.onBuild(value);
      } else {
        program.globalNamespace.locals!.set(match, {
          kind: "decorator",
          path,
          name: match,
          value,
        });
      }
    }
  }

  // Evaluates an arbitrary line of ADL in the context of a
  // specified file path.  If no path is specified, use a
  // virtual file path
  function evalAdlScript(adlScript: string, filePath?: string): void {
    filePath = filePath ?? `__virtual_file_${++virtualFileCount}`;
    const unparsedFile = createSourceFile(adlScript, filePath);
    const ast = parse(unparsedFile);
    const sourceFile: ADLSourceFile = {
      ...unparsedFile,
      ast,
      interfaces: [],
      models: [],
      namespaces: [],
    };

    program.sourceFiles.push(sourceFile);
    binder.bindSourceFile(program, sourceFile);
  }

  async function loadMain(options: CompilerOptions) {
    if (!options.mainFile) {
      throw new Error("Must specify a main file");
    }

    const mainPath = resolve(host.getCwd(), options.mainFile);

    const mainStat = await lstat(mainPath);

    if (mainStat.isDirectory()) {
      await loadDirectory(program, mainPath);
    } else {
      await loadAdlFile(program, mainPath);
    }
  }
}

export async function compile(rootDir: string, host: CompilerHost, options?: CompilerOptions) {
  const program = await createProgram(host, { mainFile: rootDir, ...options });
}
