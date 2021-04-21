import { dirname, extname, isAbsolute, join, resolve } from "path";
import resolveModule from "resolve";
import { createBinder, createSymbolTable } from "./binder.js";
import { createChecker } from "./checker.js";
import { createSourceFile, DiagnosticError, throwDiagnostic } from "./diagnostics.js";
import { CompilerOptions } from "./options.js";
import { parse } from "./parser.js";
import {
  ADLScriptNode,
  CompilerHost,
  DecoratorExpressionNode,
  DecoratorSymbol,
  IdentifierNode,
  LiteralType,
  ModelStatementNode,
  ModelType,
  NamespaceStatementNode,
  SyntaxKind,
  Type,
} from "./types.js";

export interface Program {
  compilerOptions: CompilerOptions;
  globalNamespace: NamespaceStatementNode;
  sourceFiles: ADLScriptNode[];
  literalTypes: Map<string | number | boolean, LiteralType>;
  host: CompilerHost;
  checker?: ReturnType<typeof createChecker>;
  evalAdlScript(adlScript: string, filePath?: string): void;
  onBuild(cb: (program: Program) => void): Promise<void> | void;
  getOption(key: string): string | undefined;
  executeModelDecorators(type: ModelType): void;
  executeDecorators(type: Type): void;
  executeDecorator(node: DecoratorExpressionNode, program: Program, type: Type): void;
}

export async function createProgram(
  host: CompilerHost,
  options: CompilerOptions
): Promise<Program> {
  const buildCbs: any = [];

  const seenSourceFiles = new Set<string>();
  const program: Program = {
    compilerOptions: options || {},
    globalNamespace: createGlobalNamespace(),
    sourceFiles: [],
    literalTypes: new Map(),
    host,
    evalAdlScript,
    executeModelDecorators,
    executeDecorators,
    executeDecorator,
    getOption,
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
      throwDiagnostic("Decorator must be identifier", dec);
    }

    const decName = dec.target.sv;
    const args = dec.arguments.map((a) => toJSON(checker.getTypeForNode(a)));
    const decBinding = program.globalNamespace.locals!.get(decName) as DecoratorSymbol;
    if (!decBinding) {
      throwDiagnostic(`Can't find decorator ${decName}`, dec);
    }
    const decFn = decBinding.value;
    decFn(program, type, ...args);
  }

  /**
   * returns the JSON representation of a type. This is generally
   * just the raw type objects, but literals are treated specially.
   */
  function toJSON(type: Type): Type | string | number | boolean {
    if ("value" in type) {
      return type.value;
    }

    return type;
  }

  async function loadStandardLibrary(program: Program) {
    for (const dir of host.getLibDirs()) {
      await loadDirectory(dir);
    }
  }

  async function loadDirectory(rootDir: string) {
    const dir = await host.readDir(rootDir);
    for (const entry of dir) {
      if (entry.isFile()) {
        const path = join(rootDir, entry.name);
        if (entry.name.endsWith(".js")) {
          await loadJsFile(path);
        } else if (entry.name.endsWith(".adl")) {
          await loadAdlFile(path);
        }
      }
    }
  }

  async function loadAdlFile(path: string) {
    if (seenSourceFiles.has(path)) {
      return;
    }
    seenSourceFiles.add(path);

    const contents = await host.readFile(path);
    if (!contents) {
      throw new Error("Couldn't load ADL file " + path);
    }

    await evalAdlScript(contents, path);
  }

  async function loadJsFile(path: string) {
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
  async function evalAdlScript(adlScript: string, filePath?: string): Promise<void> {
    filePath = filePath ?? `__virtual_file_${++virtualFileCount}`;
    const unparsedFile = createSourceFile(adlScript, filePath);
    const sourceFile = parse(unparsedFile);

    // We don't attempt to evaluate yet when there are parse errors.
    if (sourceFile.parseDiagnostics.length > 0) {
      throw new DiagnosticError(sourceFile.parseDiagnostics);
    }

    program.sourceFiles.push(sourceFile);
    binder.bindSourceFile(program, sourceFile);
    await evalImports(sourceFile);
  }

  async function evalImports(file: ADLScriptNode) {
    // collect imports
    for (const stmt of file.statements) {
      if (stmt.kind !== SyntaxKind.ImportStatement) break;
      const path = stmt.path;
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
            throwDiagnostic(`Couldn't find library "${path}"`, stmt);
          } else {
            throw e;
          }
        }
      }

      const ext = extname(target);

      if (ext === "") {
        // look for a main.adl
        await loadAdlFile(join(target, "main.adl"));
      } else if (ext === ".js") {
        await loadJsFile(target);
      } else if (ext === ".adl") {
        await loadAdlFile(target);
      } else {
        throwDiagnostic(
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
              .catch((e) => cb(e));
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
            // I don't know when this happens
            rejectP(new Error("Couldn't resolve module"));
          } else {
            resolveP(resolved);
          }
        }
      );
    });
  }

  async function loadMain(options: CompilerOptions) {
    if (!options.mainFile) {
      throw new Error("Must specify a main file");
    }

    const mainPath = resolve(host.getCwd(), options.mainFile);

    const mainStat = await host.stat(mainPath);

    if (mainStat.isDirectory()) {
      await loadDirectory(mainPath);
    } else {
      await loadAdlFile(mainPath);
    }
  }

  function getOption(key: string): string | undefined {
    return (options.miscOptions || {})[key];
  }
}

export async function compile(rootDir: string, host: CompilerHost, options?: CompilerOptions) {
  const program = await createProgram(host, { mainFile: rootDir, ...options });
}
