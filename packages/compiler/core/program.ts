import { dirname, extname, isAbsolute, resolve } from "path";
import resolveModule from "resolve";
import { createBinder, createSymbolTable } from "./binder.js";
import { Checker, createChecker } from "./checker.js";
import { createDiagnostic, createSourceFile, DiagnosticTarget, NoTarget } from "./diagnostics.js";
import { Message } from "./messages.js";
import { CompilerOptions } from "./options.js";
import { parse } from "./parser.js";
import {
  CadlScriptNode,
  CompilerHost,
  Diagnostic,
  IdentifierNode,
  JsSourceFile,
  LiteralType,
  NamespaceStatementNode,
  SourceFile,
  Sym,
  SymbolTable,
  SyntaxKind,
} from "./types.js";
import { doIO, loadFile } from "./util.js";

export interface Program {
  compilerOptions: CompilerOptions;
  globalNamespace: NamespaceStatementNode;
  /** All source files in the program, keyed by their file path. */
  sourceFiles: Map<string, CadlScriptNode>;
  jsSourceFiles: Map<string, JsSourceFile>;
  literalTypes: Map<string | number | boolean, LiteralType>;
  host: CompilerHost;
  checker?: Checker;
  readonly diagnostics: readonly Diagnostic[];
  evalCadlScript(cadlScript: string, filePath?: string): void;
  onBuild(cb: (program: Program) => void): Promise<void> | void;
  getOption(key: string): string | undefined;
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
    sourceFiles: new Map(),
    jsSourceFiles: new Map(),
    literalTypes: new Map(),
    host,
    diagnostics,
    evalCadlScript,
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

  async function loadStandardLibrary(program: Program) {
    for (const dir of host.getLibDirs()) {
      await loadDirectory(dir);
    }
  }

  async function loadDirectory(dir: string, diagnosticTarget?: DiagnosticTarget) {
    const pkgJsonPath = resolve(dir, "package.json");
    let [pkg] = await loadFile(host, pkgJsonPath, JSON.parse, program.reportDiagnostic, {
      allowFileNotFound: true,
      diagnosticTarget,
    });
    const mainFile = resolve(dir, typeof pkg?.cadlMain === "string" ? pkg.cadlMain : "main.cadl");
    await loadCadlFile(mainFile, diagnosticTarget);
  }

  async function loadCadlFile(path: string, diagnosticTarget?: DiagnosticTarget) {
    if (seenSourceFiles.has(path)) {
      return;
    }
    seenSourceFiles.add(path);

    const file = await doIO(host.readFile, path, program.reportDiagnostic, {
      diagnosticTarget,
    });

    if (file) {
      await evalCadlScript(file);
    }
  }

  async function loadJsFile(path: string, diagnosticTarget: DiagnosticTarget) {
    if (program.jsSourceFiles.has(path)) return;

    const file = createSourceFile("", path);
    const exports = await doIO(host.getJsImport, path, program.reportDiagnostic, {
      diagnosticTarget,
      jsDiagnosticTarget: { file, pos: 0, end: 0 },
    });

    if (!exports) {
      return;
    }

    const sourceFile: JsSourceFile = {
      exports,
      file,
      namespaces: [],
    };

    program.jsSourceFiles.set(path, sourceFile);

    binder.bindJsSourceFile(sourceFile);
  }

  // Evaluates an arbitrary line of Cadl in the context of a
  // specified file path.  If no path is specified, use a
  // virtual file path
  async function evalCadlScript(cadlScript: string | SourceFile): Promise<void> {
    if (typeof cadlScript === "string") {
      cadlScript = createSourceFile(cadlScript, `__virtual_file_${++virtualFileCount}`);
    }
    // This is not a diagnostic because the compiler should never reuse the same path.
    // It's the caller's responsibility to use unique paths.
    if (program.sourceFiles.has(cadlScript.path)) {
      throw new RangeError("Duplicate script path: " + cadlScript);
    }
    const sourceFile = parse(cadlScript);
    program.reportDiagnostics(sourceFile.parseDiagnostics);
    program.sourceFiles.set(cadlScript.path, sourceFile);
    binder.bindSourceFile(sourceFile);
    await evalImports(sourceFile);
  }

  async function evalImports(file: CadlScriptNode) {
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
      } else if (ext === ".cadl") {
        await loadCadlFile(target, stmt);
      } else {
        program.reportDiagnostic(
          "Import paths must reference either a directory, a .cadl file, or .js file",
          stmt
        );
      }
    }
  }

  /**
   * resolves a module specifier like "myLib" to an absolute path where we can find the main of
   * that module, e.g. "/cadl/node_modules/myLib/main.cadl".
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
              .then((c) => cb(null, c.text))
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
            // but using cadlMain instead of main.
            pkg.main = pkg.cadlMain;
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
    const mainPath = host.resolveAbsolutePath(mainFile);
    const mainStat = await doIO(host.stat, mainPath, program.reportDiagnostic);
    if (!mainStat) {
      return;
    }
    if (mainStat.isDirectory()) {
      await loadDirectory(mainPath);
    } else {
      await loadCadlFile(mainPath);
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
