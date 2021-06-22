import { dirname, extname, isAbsolute, resolve } from "path";
import resolveModule from "resolve";
import { createBinder, createSymbolTable } from "./binder.js";
import { Checker, createChecker } from "./checker.js";
import { createDiagnostic, createSourceFile, DiagnosticTarget, NoTarget } from "./diagnostics.js";
import { Message } from "./messages.js";
import { CompilerOptions } from "./options.js";
import { parse } from "./parser.js";
import {
  ADLScriptNode,
  CompilerHost,
  DecoratorExpressionNode,
  DecoratorSymbol,
  Diagnostic,
  IdentifierNode,
  LiteralType,
  ModelStatementNode,
  ModelType,
  NamespaceStatementNode,
  Sym,
  SymbolTable,
  SyntaxKind,
  Type,
} from "./types.js";
import { doIO, loadFile } from "./util.js";

export interface Program {
  compilerOptions: CompilerOptions;
  globalNamespace: NamespaceStatementNode;
  sourceFiles: ADLScriptNode[];
  literalTypes: Map<string | number | boolean, LiteralType>;
  host: CompilerHost;
  checker?: Checker;
  readonly diagnostics: readonly Diagnostic[];
  evalAdlScript(adlScript: string, filePath?: string): void;
  onBuild(cb: (program: Program) => void): Promise<void> | void;
  getOption(key: string): string | undefined;
  executeModelDecorators(type: ModelType): void;
  executeDecorators(type: Type): void;
  executeDecorator(node: DecoratorExpressionNode, program: Program, type: Type): void;
  stateSet(key: Symbol): Set<any>;
  stateMap(key: Symbol): Map<any, any>;
  hasError(): boolean;
  reportDiagnostic(
    message: Message | string,
    target: DiagnosticTarget | typeof NoTarget,
    args?: (string | number)[]
  ): void;
  reportDiagnostic(diagnostic: Diagnostic): void;
  reportDiagnostics(diagnostics: Diagnostic[]): void;
  reportDuplicateSymbols(symbols: SymbolTable): void;
}

export async function createProgram(
  host: CompilerHost,
  mainFile: string,
  options: CompilerOptions = {}
): Promise<Program> {
  const buildCbs: any = [];
  const stateMaps = new Map<Symbol, Map<any, any>>();
  const stateSets = new Map<Symbol, Set<any>>();
  const diagnostics: Diagnostic[] = [];
  const seenSourceFiles = new Set<string>();
  const duplicateSymbols = new Set<Sym>();
  let error = false;

  const program: Program = {
    compilerOptions: options,
    globalNamespace: createGlobalNamespace(),
    sourceFiles: [],
    literalTypes: new Map(),
    host,
    diagnostics,
    evalAdlScript,
    executeModelDecorators,
    executeDecorators,
    executeDecorator,
    getOption,
    stateMap,
    stateSet,
    reportDiagnostic,
    reportDiagnostics,
    reportDuplicateSymbols,
    hasError() {
      return error;
    },
    onBuild(cb) {
      buildCbs.push(cb);
    },
  };

  let virtualFileCount = 0;
  const binder = createBinder(program);

  if (!options?.nostdlib) {
    await loadStandardLibrary(program);
  }

  await loadMain(mainFile, options);

  const checker = (program.checker = createChecker(program));
  program.checker.checkProgram(program);

  for (const cb of buildCbs) {
    await cb(program);
  }

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
      locals: createSymbolTable(),
      exports: createSymbolTable(),
    };
  }

  function executeModelDecorators(type: ModelType) {
    const stmt = (type.templateNode || type.node) as ModelStatementNode;

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
    if (type.node && "decorators" in type.node) {
      for (const dec of type.node.decorators) {
        executeDecorator(dec, program, type);
      }
    }
  }

  function executeDecorator(dec: DecoratorExpressionNode, program: Program, type: Type) {
    if (dec.target.kind !== SyntaxKind.Identifier) {
      program.reportDiagnostic("Decorator must be identifier", dec);
      return;
    }

    const decName = dec.target.sv;
    const args = dec.arguments.map((a) => toJSON(checker.getTypeForNode(a)));
    const decBinding = program.globalNamespace.locals!.get(decName) as DecoratorSymbol;
    if (!decBinding) {
      program.reportDiagnostic(`Can't find decorator ${decName}`, dec);
      return;
    }
    const decFn = decBinding.value;
    decFn(program, type, ...args);
  }

  /**
   * returns the JSON representation of a type. This is generally
   * just the raw type objects, but literals are treated specially.
   */
  function toJSON(type: Type): Type | string | number | boolean {
    if (type.kind === "Number" || type.kind === "String" || type.kind === "Boolean") {
      return type.value;
    }

    return type;
  }

  async function loadStandardLibrary(program: Program) {
    for (const dir of host.getLibDirs()) {
      await loadDirectory(dir);
    }
  }

  async function loadDirectory(dir: string, diagnosticTarget?: DiagnosticTarget) {
    const pkgJsonPath = resolve(dir, "package.json");
    let [pkg] = await loadFile(host.readFile, pkgJsonPath, JSON.parse, program.reportDiagnostic, {
      allowFileNotFound: true,
      diagnosticTarget,
    });
    const mainFile = resolve(dir, pkg?.adlMain ?? "main.adl");
    await loadAdlFile(mainFile, diagnosticTarget);
  }

  async function loadAdlFile(path: string, diagnosticTarget?: DiagnosticTarget) {
    if (seenSourceFiles.has(path)) {
      return;
    }
    seenSourceFiles.add(path);

    const contents = await doIO(host.readFile, path, program.reportDiagnostic, {
      diagnosticTarget,
    });

    if (contents) {
      await evalAdlScript(contents, path);
    }
  }

  async function loadJsFile(path: string, diagnosticTarget: DiagnosticTarget) {
    const exports = await doIO(host.getJsImport, path, program.reportDiagnostic, {
      diagnosticTarget,
      jsDiagnosticTarget: { file: createSourceFile("", path), pos: 0, end: 0 },
    });

    if (!exports) {
      return;
    }

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
  async function evalAdlScript(adlScript: string, filePath?: string): Promise<void> {
    filePath = filePath ?? `__virtual_file_${++virtualFileCount}`;
    const unparsedFile = createSourceFile(adlScript, filePath);
    const sourceFile = parse(unparsedFile);

    program.reportDiagnostics(sourceFile.parseDiagnostics);
    program.sourceFiles.push(sourceFile);
    binder.bindSourceFile(sourceFile);
    await evalImports(sourceFile);
  }

  async function evalImports(file: ADLScriptNode) {
    // collect imports
    for (const stmt of file.statements) {
      if (stmt.kind !== SyntaxKind.ImportStatement) break;
      const path = stmt.path.value;
      const basedir = dirname(file.file.path);

      let target: string;
      if (path.startsWith("./") || path.startsWith("../")) {
        target = resolve(basedir, path);
      } else if (isAbsolute(path)) {
        target = path;
      } else {
        try {
          // attempt to resolve a node module with this name
          target = await resolveModuleSpecifier(path, basedir);
        } catch (e) {
          if (e.code === "MODULE_NOT_FOUND") {
            program.reportDiagnostic(`Couldn't find library "${path}"`, stmt);
            continue;
          } else {
            throw e;
          }
        }
      }

      const ext = extname(target);

      if (ext === "") {
        await loadDirectory(target, stmt);
      } else if (ext === ".js" || ext === ".mjs") {
        await loadJsFile(target, stmt);
      } else if (ext === ".adl") {
        await loadAdlFile(target, stmt);
      } else {
        program.reportDiagnostic(
          "Import paths must reference either a directory, a .adl file, or .js file",
          stmt
        );
      }
    }
  }

  /**
   * resolves a module specifier like "myLib" to an absolute path where we can find the main of
   * that module, e.g. "/adl/node_modules/myLib/main.adl".
   */
  function resolveModuleSpecifier(specifier: string, basedir: string): Promise<string> {
    return new Promise((resolveP, rejectP) => {
      resolveModule(
        specifier,
        {
          // default node semantics are preserveSymlinks: false
          // this ensures that we resolve our monorepo referecnes to an actual location
          // on disk.
          preserveSymlinks: false,
          basedir,
          readFile(path, cb) {
            host
              .readFile(path)
              .then((c) => cb(null, c))
              .catch((e) => cb(e));
          },
          isDirectory(path, cb) {
            host
              .stat(path)
              .then((s) => cb(null, s.isDirectory()))
              .catch((e) => {
                if (e.code === "ENOENT" || e.code === "ENOTDIR") {
                  cb(null, false);
                } else {
                  cb(e);
                }
              });
          },
          isFile(path, cb) {
            host
              .stat(path)
              .then((s) => cb(null, s.isFile()))
              .catch((e) => {
                if (e.code === "ENOENT" || e.code === "ENOTDIR") {
                  cb(null, false);
                } else {
                  cb(e);
                }
              });
          },
          realpath(path, cb) {
            host
              .realpath(path)
              .then((p) => cb(null, p))
              .catch((e) => {
                if (e.code === "ENOENT" || e.code === "ENOTDIR") {
                  cb(null, path);
                } else {
                  cb(e);
                }
              });
          },
          packageFilter(pkg) {
            // this lets us follow node resolve semantics more-or-less exactly
            // but using adlMain instead of main.
            pkg.main = pkg.adlMain;
            return pkg;
          },
        },
        (err, resolved) => {
          if (err) {
            rejectP(err);
          } else if (!resolved) {
            rejectP(new Error("BUG: Module resolution succeeded but didn't return a value."));
          } else {
            resolveP(resolved);
          }
        }
      );
    });
  }

  async function loadMain(mainFile: string, options: CompilerOptions) {
    const mainPath = resolve(host.getCwd(), mainFile);
    const mainStat = await doIO(host.stat, mainPath, program.reportDiagnostic);
    if (!mainStat) {
      return;
    }
    if (mainStat.isDirectory()) {
      await loadDirectory(mainPath);
    } else {
      await loadAdlFile(mainPath);
    }
  }

  function getOption(key: string): string | undefined {
    return (options.miscOptions || {})[key];
  }

  function stateMap(key: Symbol): Map<any, any> {
    let m = stateMaps.get(key);
    if (!m) {
      m = new Map();
      stateMaps.set(key, m);
    }

    return m;
  }

  function stateSet(key: Symbol): Set<any> {
    let s = stateSets.get(key);
    if (!s) {
      s = new Set();
      stateSets.set(key, s);
    }

    return s;
  }

  function reportDiagnostic(diagnostic: Diagnostic): void;

  function reportDiagnostic(
    message: Message | string,
    target: DiagnosticTarget | typeof NoTarget,
    args?: (string | number)[]
  ): void;

  function reportDiagnostic(
    diagnostic: Message | string | Diagnostic,
    target?: DiagnosticTarget | typeof NoTarget,
    args?: (string | number)[]
  ): void {
    if (typeof diagnostic === "string" || "text" in diagnostic) {
      diagnostic = createDiagnostic(diagnostic, target!, args);
    }
    if (diagnostic.severity === "error") {
      error = true;
    }
    diagnostics.push(diagnostic);
  }

  function reportDiagnostics(newDiagnostics: Diagnostic[]) {
    for (const diagnostic of newDiagnostics) {
      reportDiagnostic(diagnostic);
    }
  }

  function reportDuplicateSymbols(symbols: SymbolTable) {
    for (const symbol of symbols.duplicates) {
      if (!duplicateSymbols.has(symbol)) {
        duplicateSymbols.add(symbol);
        reportDiagnostic("Duplicate name: " + symbol.name, symbol);
      }
    }
  }
}

export async function compile(
  mainFile: string,
  host: CompilerHost,
  options?: CompilerOptions
): Promise<Program> {
  return await createProgram(host, mainFile, options);
}
