import { createBinder } from "./binder.js";
import { Checker, createChecker } from "./checker.js";
import { compilerAssert, createSourceFile } from "./diagnostics.js";
import { getLibraryUrlsLoaded } from "./library.js";
import { createLogger } from "./logger/index.js";
import { createTracer } from "./logger/tracer.js";
import { MANIFEST } from "./manifest.js";
import { createDiagnostic } from "./messages.js";
import {
  ModuleResolutionResult,
  NodePackage,
  ResolvedModule,
  resolveModule,
  ResolveModuleHost,
} from "./module-resolver.js";
import { CompilerOptions } from "./options.js";
import { isImportStatement, parse } from "./parser.js";
import { getDirectoryPath, joinPaths, resolvePath } from "./path-utils.js";
import { createProjector } from "./projector.js";
import {
  CadlLibrary,
  CadlScriptNode,
  CompilerHost,
  Diagnostic,
  DiagnosticTarget,
  Directive,
  DirectiveExpressionNode,
  Emitter,
  EmitterOptions,
  JsSourceFileNode,
  LiteralType,
  Namespace,
  Node,
  NodeFlags,
  NoTarget,
  ProjectionApplication,
  Projector,
  SourceFile,
  Sym,
  SymbolFlags,
  SymbolTable,
  SyntaxKind,
  Tracer,
  Type,
} from "./types.js";
import { deepEquals, doIO, findProjectRoot, loadFile, mapEquals } from "./util.js";

export interface ProjectedProgram extends Program {
  projector: Projector;
}

export function isProjectedProgram(
  program: Program | ProjectedProgram
): program is ProjectedProgram {
  return "projector" in program;
}

export interface Program {
  compilerOptions: CompilerOptions;
  mainFile?: CadlScriptNode;
  /** All source files in the program, keyed by their file path. */
  sourceFiles: Map<string, CadlScriptNode>;
  jsSourceFiles: Map<string, JsSourceFileNode>;
  literalTypes: Map<string | number | boolean, LiteralType>;
  host: CompilerHost;
  tracer: Tracer;
  trace(area: string, message: string): void;
  checker: Checker;
  emitters: EmitterRef[];
  readonly diagnostics: readonly Diagnostic[];
  loadCadlScript(cadlScript: SourceFile): Promise<CadlScriptNode>;
  onValidate(cb: (program: Program) => void | Promise<void>): void;
  getOption(key: string): string | undefined;
  stateSet(key: symbol): Set<Type>;
  stateSets: Map<symbol, StateSet>;
  stateMap(key: symbol): Map<Type, any>;
  stateMaps: Map<symbol, StateMap>;
  hasError(): boolean;
  reportDiagnostic(diagnostic: Diagnostic): void;
  reportDiagnostics(diagnostics: readonly Diagnostic[]): void;
  reportDuplicateSymbols(symbols: SymbolTable | undefined): void;
  getGlobalNamespaceType(): Namespace;
}

interface EmitterRef {
  emitter: Emitter;
  options: EmitterOptions;
}

class StateMap extends Map<undefined | Projector, Map<Type, unknown>> {}
class StateSet extends Map<undefined | Projector, Set<Type>> {}

class StateMapView<V> implements Map<Type, V> {
  public constructor(private state: StateMap, private projector?: Projector) {}

  has(t: Type) {
    return this.dispatch(t)?.has(t) ?? false;
  }

  set(t: Type, v: any) {
    this.dispatch(t).set(t, v);
    return this;
  }

  get(t: Type) {
    return this.dispatch(t).get(t);
  }

  delete(t: Type) {
    return this.dispatch(t).delete(t);
  }

  forEach(cb: (value: V, key: Type, map: Map<Type, V>) => void, thisArg?: any) {
    this.dispatch().forEach(cb, thisArg);
    return this;
  }

  get size() {
    return this.dispatch().size;
  }

  clear() {
    return this.dispatch().clear();
  }

  entries() {
    return this.dispatch().entries();
  }

  values() {
    return this.dispatch().values();
  }

  keys() {
    return this.dispatch().keys();
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  [Symbol.toStringTag] = "StateMap";

  dispatch(keyType?: Type): Map<Type, V> {
    const key = keyType ? keyType.projector : this.projector;
    if (!this.state.has(key)) {
      this.state.set(key, new Map());
    }

    return this.state.get(key)! as any;
  }
}

class StateSetView implements Set<Type> {
  public constructor(private state: StateSet, private projector?: Projector) {}

  has(t: Type) {
    return this.dispatch(t)?.has(t) ?? false;
  }

  add(t: Type) {
    this.dispatch(t).add(t);
    return this;
  }

  delete(t: Type) {
    return this.dispatch(t).delete(t);
  }

  forEach(cb: (value: Type, value2: Type, set: Set<Type>) => void, thisArg?: any) {
    this.dispatch().forEach(cb, thisArg);
    return this;
  }

  get size() {
    return this.dispatch().size;
  }

  clear() {
    return this.dispatch().clear();
  }

  values() {
    return this.dispatch().values();
  }

  keys() {
    return this.dispatch().keys();
  }

  entries() {
    return this.dispatch().entries();
  }

  [Symbol.iterator]() {
    return this.values();
  }

  [Symbol.toStringTag] = "StateSet";

  dispatch(keyType?: Type): Set<Type> {
    const key = keyType ? keyType.projector : this.projector;
    if (!this.state.has(key)) {
      this.state.set(key, new Set());
    }

    return this.state.get(key)!;
  }
}

interface CadlLibraryReference {
  path: string;
  manifest: NodePackage;
}

export function projectProgram(
  program: Program,
  projections: ProjectionApplication[],
  startNode?: Type
): ProjectedProgram {
  return createProjector(program, projections, startNode);
}

export async function createProgram(
  host: CompilerHost,
  mainFile: string,
  options: CompilerOptions = {},
  oldProgram?: Program // NOTE: deliberately separate from options to avoid memory leak by chaining all old programs together.
): Promise<Program> {
  const validateCbs: any = [];
  const stateMaps = new Map<symbol, StateMap>();
  const stateSets = new Map<symbol, StateSet>();
  const diagnostics: Diagnostic[] = [];
  const seenSourceFiles = new Set<string>();
  const duplicateSymbols = new Set<Sym>();
  const emitters: EmitterRef[] = [];
  const requireImports = new Map<string, string>();
  const loadedLibraries = new Map<string, CadlLibraryReference>();
  let error = false;

  const logger = createLogger({ sink: host.logSink, level: options.diagnosticLevel });
  const tracer = createTracer(logger, { filter: options.trace });

  const program: Program = {
    checker: undefined!,
    compilerOptions: options,
    sourceFiles: new Map(),
    jsSourceFiles: new Map(),
    literalTypes: new Map(),
    host,
    diagnostics,
    emitters,
    loadCadlScript,
    getOption,
    stateMaps,
    stateSets,
    tracer,
    trace,
    ...createStateAccessors(stateMaps, stateSets),
    reportDiagnostic,
    reportDiagnostics,
    reportDuplicateSymbols,
    hasError() {
      return error;
    },
    onValidate(cb) {
      validateCbs.push(cb);
    },
    getGlobalNamespaceType,
  };

  function trace(area: string, message: string) {
    tracer.trace(area, message);
  }
  const binder = createBinder(program);

  if (!options?.nostdlib) {
    await loadStandardLibrary(program);
  }

  const resolvedMain = await resolveCadlEntrypoint(mainFile);
  // Load additional imports prior to compilation
  if (resolvedMain && options.additionalImports) {
    const importScript = options.additionalImports.map((i) => `import "${i}";`).join("\n");
    const sourceFile = createSourceFile(
      importScript,
      joinPaths(getDirectoryPath(resolvedMain), `__additional_imports`)
    );
    await loadCadlScript(sourceFile);
  }

  if (resolvedMain) {
    await loadMain(resolvedMain, options);
  }

  if (resolvedMain && options.emitters) {
    const emitters = computeEmitters(options.emitters);
    await loadEmitters(resolvedMain, emitters);
  }

  if (
    oldProgram &&
    mapEquals(oldProgram.sourceFiles, program.sourceFiles) &&
    deepEquals(oldProgram.compilerOptions, program.compilerOptions)
  ) {
    return oldProgram;
  }

  // let GC reclaim old program, we do not reuse it beyond this point.
  oldProgram = undefined;

  program.checker = createChecker(program);
  program.checker.checkProgram();

  if (program.hasError()) {
    return program;
  }
  for (const cb of validateCbs) {
    try {
      await cb(program);
    } catch (error: any) {
      if (options.designTimeBuild) {
        program.reportDiagnostic(
          createDiagnostic({
            code: "on-validate-fail",
            format: { error: error.stack },
            target: NoTarget,
          })
        );
      } else {
        throw error;
      }
    }
  }

  for (const [requiredImport, emitterName] of requireImports) {
    if (!loadedLibraries.has(requiredImport)) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "missing-import",
          format: { requiredImport, emitterName },
          target: NoTarget,
        })
      );
    }
  }

  await validateLoadedLibraries();
  if (program.hasError()) {
    return program;
  }

  for (const instance of emitters) {
    await instance.emitter(program, instance.options);
  }

  return program;

  /**
   * Validate the libraries loaded during the compilation process are compatible.
   */
  async function validateLoadedLibraries() {
    const loadedRoots = new Set<string>();
    // Check all the files that were loaded
    for (const fileUrl of getLibraryUrlsLoaded()) {
      const root = await findProjectRoot(host, host.fileURLToPath(fileUrl));
      if (root) {
        loadedRoots.add(root);
      }
    }

    const libraries = new Map([...loadedLibraries.entries()]);
    const incompatibleLibraries = new Map<string, CadlLibraryReference[]>();
    for (const root of loadedRoots) {
      const packageJsonPath = joinPaths(root, "package.json");
      try {
        const packageJson: NodePackage = JSON.parse((await host.readFile(packageJsonPath)).text);
        const found = libraries.get(packageJson.name);
        if (found && found.path !== root && found.manifest.version !== packageJson.version) {
          let incompatibleIndex: CadlLibraryReference[] | undefined = incompatibleLibraries.get(
            packageJson.name
          );
          if (incompatibleIndex === undefined) {
            incompatibleIndex = [found];
            incompatibleLibraries.set(packageJson.name, incompatibleIndex);
          }
          incompatibleIndex.push({ path: root, manifest: packageJson });
        }
      } catch {}
    }

    for (const [name, incompatibleLibs] of incompatibleLibraries) {
      reportDiagnostic(
        createDiagnostic({
          code: "incompatible-library",
          format: {
            name: name,
            versionMap: incompatibleLibs
              .map((x) => `  - Version: "${x.manifest.version}" installed at "${x.path}"`)
              .join("\n"),
          },
          target: NoTarget,
        })
      );
    }
  }
  async function loadStandardLibrary(program: Program) {
    for (const dir of host.getLibDirs()) {
      await loadDirectory(dir, NoTarget);
    }
  }

  async function loadDirectory(
    dir: string,
    diagnosticTarget: DiagnosticTarget | typeof NoTarget
  ): Promise<string> {
    const mainFile = await resolveCadlEntrypointForDir(dir);
    await loadCadlFile(mainFile, diagnosticTarget);
    return mainFile;
  }

  async function loadCadlFile(path: string, diagnosticTarget: DiagnosticTarget | typeof NoTarget) {
    if (seenSourceFiles.has(path)) {
      return;
    }
    seenSourceFiles.add(path);

    const file = await doIO(host.readFile, path, program.reportDiagnostic, {
      diagnosticTarget,
    });

    if (file) {
      await loadCadlScript(file);
    }
  }

  async function loadJsFile(
    path: string,
    diagnosticTarget: DiagnosticTarget | typeof NoTarget
  ): Promise<JsSourceFileNode | undefined> {
    const sourceFile = program.jsSourceFiles.get(path);
    if (sourceFile !== undefined) {
      return sourceFile;
    }

    const file = createSourceFile("", path);
    const exports = await doIO(host.getJsImport, path, program.reportDiagnostic, {
      diagnosticTarget,
      jsDiagnosticTarget: { file, pos: 0, end: 0 },
    });

    if (!exports) {
      return undefined;
    }

    return {
      kind: SyntaxKind.JsSourceFile,
      id: {
        kind: SyntaxKind.Identifier,
        sv: "",
        pos: 0,
        end: 0,
        symbol: undefined!,
        flags: NodeFlags.Synthetic,
      },
      esmExports: exports,
      file,
      namespaceSymbols: [],
      symbol: undefined!,
      pos: 0,
      end: 0,
      flags: NodeFlags.None,
    };
  }

  /**
   * Import the Javascript files decorator and lifecycle hooks.
   */
  async function importJsFile(path: string, diagnosticTarget: DiagnosticTarget | typeof NoTarget) {
    const file = await loadJsFile(path, diagnosticTarget);
    if (file !== undefined) {
      program.jsSourceFiles.set(path, file);
      binder.bindJsSourceFile(file);
    }
  }

  async function loadCadlScript(file: SourceFile): Promise<CadlScriptNode> {
    // This is not a diagnostic because the compiler should never reuse the same path.
    // It's the caller's responsibility to use unique paths.
    if (program.sourceFiles.has(file.path)) {
      throw new RangeError("Duplicate script path: " + file.path);
    }

    const script = parseOrReuse(file);
    program.reportDiagnostics(script.parseDiagnostics);
    program.sourceFiles.set(file.path, script);
    binder.bindSourceFile(script);
    await loadScriptImports(script);
    return script;
  }

  function parseOrReuse(file: SourceFile): CadlScriptNode {
    const old = oldProgram?.sourceFiles.get(file.path) ?? host?.parseCache?.get(file);
    if (old?.file === file && deepEquals(old.parseOptions, options.parseOptions)) {
      return old;
    }
    const script = parse(file, options.parseOptions);
    host.parseCache?.set(file, script);
    return script;
  }

  async function loadScriptImports(file: CadlScriptNode) {
    // collect imports
    const basedir = getDirectoryPath(file.file.path);
    await loadImports(
      file.statements.filter(isImportStatement).map((x) => ({ path: x.path.value, target: x })),
      basedir
    );
  }

  async function loadImports(
    imports: Array<{ path: string; target: DiagnosticTarget | typeof NoTarget }>,
    relativeTo: string
  ) {
    // collect imports
    for (const { path, target } of imports) {
      await loadImport(path, target, relativeTo);
    }
  }

  async function loadImport(
    path: string,
    target: DiagnosticTarget | typeof NoTarget,
    relativeTo: string
  ) {
    const library = await resolveCadlLibrary(path, relativeTo, target);
    if (library === undefined) {
      return;
    }
    if (library.type === "module") {
      loadedLibraries.set(library.manifest.name, {
        path: library.path,
        manifest: library.manifest,
      });
      trace("import-resolution.library", `Loading library "${path}" from "${library.mainFile}"`);
    }
    const importFilePath = library.type === "module" ? library.mainFile : library.path;

    const isDirectory = (await host.stat(importFilePath)).isDirectory();
    if (isDirectory) {
      return await loadDirectory(importFilePath, target);
    }

    const sourceFileKind = host.getSourceFileKind(importFilePath);

    switch (sourceFileKind) {
      case "js":
        return await importJsFile(importFilePath, target);
      case "cadl":
        return await loadCadlFile(importFilePath, target);
      default:
        program.reportDiagnostic(createDiagnostic({ code: "invalid-import", target }));
    }
  }

  async function loadEmitters(mainFile: string, emitters: Record<string, Record<string, unknown>>) {
    for (const [emitterPackage, options] of Object.entries(emitters)) {
      await loadEmitter(mainFile, emitterPackage, options);
    }
  }

  async function loadEmitter(
    mainFile: string,
    emitterPackage: string,
    options: Record<string, unknown>
  ) {
    const basedir = getDirectoryPath(mainFile);
    // attempt to resolve a node module with this name
    const module = await resolveJSLibrary(emitterPackage, basedir);
    if (!module) {
      return;
    }

    const file = await loadJsFile(module, NoTarget);

    if (file === undefined) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "emitter-not-found",
          format: { emitterPackage },
          target: NoTarget,
        })
      );
      return;
    }

    const emitterFunction = file.esmExports.$onEmit;
    const libDefinition: CadlLibrary<any> | undefined = file.esmExports.$lib;
    if (libDefinition?.requireImports) {
      for (const lib of libDefinition.requireImports) {
        requireImports.set(lib, libDefinition.name);
      }
    }
    if (emitterFunction !== undefined) {
      if (libDefinition?.emitter?.options) {
        const diagnostics = libDefinition?.emitterOptionValidator?.validate(options, NoTarget);
        if (diagnostics && diagnostics.length > 0) {
          program.reportDiagnostics(diagnostics);
          return;
        }
      }
      emitters.push({ emitter: emitterFunction, options });
    } else {
      program.reportDiagnostic(
        createDiagnostic({
          code: "emitter-not-found",
          format: { emitterPackage },
          target: NoTarget,
        })
      );
    }
  }

  /**
   * resolves a module specifier like "myLib" to an absolute path where we can find the main of
   * that module, e.g. "/cadl/node_modules/myLib/main.cadl".
   */
  async function resolveCadlLibrary(
    specifier: string,
    baseDir: string,
    target: DiagnosticTarget | typeof NoTarget
  ): Promise<ModuleResolutionResult | undefined> {
    try {
      return await resolveModule(getResolveModuleHost(), specifier, {
        baseDir,
        directoryIndexFiles: ["main.cadl", "index.mjs", "index.js"],
        resolveMain(pkg) {
          // this lets us follow node resolve semantics more-or-less exactly
          // but using cadlMain instead of main.
          return pkg.cadlMain ?? pkg.main;
        },
      });
    } catch (e: any) {
      if (e.code === "MODULE_NOT_FOUND") {
        program.reportDiagnostic(
          createDiagnostic({ code: "import-not-found", format: { path: specifier }, target })
        );
        return undefined;
      } else if (e.code === "INVALID_MAIN") {
        program.reportDiagnostic(
          createDiagnostic({
            code: "library-invalid",
            format: { path: specifier },
            messageId: "cadlMain",
            target,
          })
        );
        return undefined;
      } else {
        throw e;
      }
    }
  }

  /**
   * resolves a module specifier like "myLib" to an absolute path where we can find the main of
   * that module, e.g. "/cadl/node_modules/myLib/dist/lib.js".
   */
  async function resolveJSLibrary(specifier: string, baseDir: string): Promise<string | undefined> {
    try {
      const resolved = await resolveModule(getResolveModuleHost(), specifier, { baseDir });
      if (resolved.type === "file") {
        return resolved.path;
      } else {
        return resolved.mainFile;
      }
    } catch (e: any) {
      if (e.code === "MODULE_NOT_FOUND") {
        program.reportDiagnostic(
          createDiagnostic({
            code: "import-not-found",
            format: { path: specifier },
            target: NoTarget,
          })
        );
        return undefined;
      } else if (e.code === "INVALID_MAIN") {
        program.reportDiagnostic(
          createDiagnostic({
            code: "library-invalid",
            format: { path: specifier },
            target: NoTarget,
          })
        );
        return undefined;
      } else {
        throw e;
      }
    }
  }

  function getResolveModuleHost(): ResolveModuleHost {
    return {
      realpath: host.realpath,
      stat: host.stat,
      readFile: async (path) => {
        const file = await host.readFile(path);
        return file.text;
      },
    };
  }

  /**
   * Resolve the path to the main file
   * @param path path to the entrypoint of the program. Can be the main.cadl, folder containg main.cadl or a project/library root.
   * @returns Absolute path to the entrypoint.
   */
  async function resolveCadlEntrypoint(path: string): Promise<string | undefined> {
    const resolvedPath = resolvePath(path);
    const mainStat = await doIO(host.stat, resolvedPath, program.reportDiagnostic);
    if (!mainStat) {
      return undefined;
    }

    if (mainStat.isDirectory()) {
      return resolveCadlEntrypointForDir(resolvedPath);
    } else {
      return resolvedPath;
    }
  }

  async function resolveCadlEntrypointForDir(dir: string): Promise<string> {
    const pkgJsonPath = resolvePath(dir, "package.json");
    const [pkg] = await loadFile(host, pkgJsonPath, JSON.parse, program.reportDiagnostic, {
      allowFileNotFound: true,
    });
    const mainFile = resolvePath(
      dir,
      typeof pkg?.cadlMain === "string" ? pkg.cadlMain : "main.cadl"
    );
    return mainFile;
  }

  /**
   * Load the main file from the given path
   * @param mainPath Absolute path to the main file.
   * @param options Compiler options.
   * @returns
   */
  async function loadMain(mainPath: string, options: CompilerOptions): Promise<void> {
    await checkForCompilerVersionMismatch(mainPath);

    const sourceFileKind = host.getSourceFileKind(mainPath);

    switch (sourceFileKind) {
      case "js":
        return await importJsFile(mainPath, NoTarget);
      case "cadl":
        return await loadCadlFile(mainPath, NoTarget);
      default:
        program.reportDiagnostic(createDiagnostic({ code: "invalid-main", target: NoTarget }));
    }
  }

  // It's important that we use the compiler version that resolves locally
  // from the input Cadl source location. Otherwise, there will be undefined
  // runtime behavior when decorators and handlers expect a
  // different version of cadl than the current one. Abort the compilation
  // with an error if the Cadl entry point resolves to a different local
  // compiler.
  async function checkForCompilerVersionMismatch(mainPath: string): Promise<boolean> {
    const baseDir = getDirectoryPath(mainPath);
    let actual: ResolvedModule;
    try {
      const resolved = await resolveModule(
        {
          realpath: host.realpath,
          stat: host.stat,
          readFile: async (path) => {
            const file = await host.readFile(path);
            return file.text;
          },
        },
        "@cadl-lang/compiler",
        { baseDir }
      );
      compilerAssert(
        resolved.type === "module",
        `Expected to have resolved "@cadl-lang/compiler" to a node module.`
      );
      actual = resolved;
    } catch (err: any) {
      if (err.code === "MODULE_NOT_FOUND" || err.code === "INVALID_MAIN") {
        return true; // no local cadl, ok to use any compiler
      }
      throw err;
    }

    const expected = resolvePath(
      await host.realpath(host.fileURLToPath(import.meta.url)),
      "../index.js"
    );

    if (actual.mainFile !== expected && MANIFEST.version !== actual.manifest.version) {
      // we have resolved node_modules/@cadl-lang/compiler/dist/core/index.js and we want to get
      // to the shim executable node_modules/.bin/cadl-server
      const betterCadlServerPath = resolvePath(actual.path, ".bin/cadl-server");
      program.reportDiagnostic(
        createDiagnostic({
          code: "compiler-version-mismatch",
          format: { basedir: baseDir, betterCadlServerPath, actual: actual.mainFile, expected },
          target: NoTarget,
        })
      );
      return false;
    }

    return true;
  }

  function getOption(key: string): string | undefined {
    return (options.miscOptions || {})[key];
  }

  function reportDiagnostic(diagnostic: Diagnostic): void {
    if (shouldSuppress(diagnostic)) {
      return;
    }

    if (options.warningAsError && diagnostic.severity === "warning") {
      diagnostic = { ...diagnostic, severity: "error" };
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

  function shouldSuppress(diagnostic: Diagnostic): boolean {
    const { target } = diagnostic;
    if (diagnostic.code === "error") {
      diagnostics.push(diagnostic);
      return false;
    }

    if (target === NoTarget || target === undefined) {
      return false;
    }

    if ("file" in target) {
      return false; // No global file suppress yet.
    }

    const node = getNode(target);
    if (node === undefined) {
      return false; // Can't find target cannot be suppressed.
    }

    const suppressing = findDirectiveSuppressingOnNode(diagnostic.code, node);
    if (suppressing) {
      if (diagnostic.severity === "error") {
        // Cannot suppress errors.
        diagnostics.push({
          severity: "error",
          code: "suppress-error",
          message: "Errors cannot be suppressed.",
          target: suppressing.node,
        });

        return false;
      } else {
        return true;
      }
    }
    return false;
  }

  function findDirectiveSuppressingOnNode(code: string, node: Node): Directive | undefined {
    let current: Node | undefined = node;
    do {
      if (current.directives) {
        const directive = findDirectiveSuppressingCode(code, current.directives);
        if (directive) {
          return directive;
        }
      }
    } while ((current = current.parent));
    return undefined;
  }

  /**
   * Returns the directive node that is suppressing this code.
   * @param code Code to check for suppression.
   * @param directives List of directives.
   * @returns Directive suppressing this code if found, `undefined` otherwise
   */
  function findDirectiveSuppressingCode(
    code: string,
    directives: readonly DirectiveExpressionNode[]
  ): Directive | undefined {
    for (const directive of directives.map((x) => parseDirective(x))) {
      if (directive.name === "suppress") {
        if (directive.code === code) {
          return directive;
        }
      }
    }
    return undefined;
  }

  function parseDirective(node: DirectiveExpressionNode): Directive {
    const args = node.arguments.map((x) => {
      return x.kind === SyntaxKind.Identifier ? x.sv : x.value;
    });
    switch (node.target.sv) {
      case "suppress":
        return { name: "suppress", code: args[0], message: args[1], node };
      default:
        throw new Error("Unexpected directive name.");
    }
  }

  function getNode(target: Node | Type | Sym): Node | undefined {
    if (!("kind" in target)) {
      // symbol
      if (target.flags & SymbolFlags.Using) {
        return target.symbolSource!.declarations[0];
      }

      return target.declarations[0]; // handle multiple decls
    } else if (typeof target.kind === "number") {
      // node
      return target as Node;
    } else {
      // type
      return (target as Type).node;
    }
  }

  function reportDuplicateSymbols(symbols: SymbolTable | undefined) {
    if (!symbols) {
      return;
    }
    for (const set of symbols.duplicates.values()) {
      for (const symbol of set) {
        if (!duplicateSymbols.has(symbol)) {
          duplicateSymbols.add(symbol);
          const name = symbol.flags & SymbolFlags.Using ? symbol.symbolSource!.name : symbol.name;
          reportDiagnostic(
            createDiagnostic({
              code: "duplicate-symbol",
              format: { name },
              target: symbol,
            })
          );
        }
      }
    }
  }

  function getGlobalNamespaceType() {
    return program.checker!.getGlobalNamespaceType();
  }
}

export function createStateAccessors(
  stateMaps: Map<symbol, StateMap>,
  stateSets: Map<symbol, StateSet>,
  projector?: Projector
) {
  function stateMap<T>(key: symbol): StateMapView<T> {
    let m = stateMaps.get(key);

    if (!m) {
      m = new StateMap();
      stateMaps.set(key, m);
    }

    return new StateMapView(m, projector);
  }

  function stateSet(key: symbol): StateSetView {
    let s = stateSets.get(key);

    if (!s) {
      s = new StateSet();
      stateSets.set(key, s);
    }

    return new StateSetView(s, projector);
  }

  return { stateMap, stateSet };
}

export async function compile(
  mainFile: string,
  host: CompilerHost,
  options?: CompilerOptions,
  oldProgram?: Program
): Promise<Program> {
  return await createProgram(host, mainFile, options, oldProgram);
}

function computeEmitters(
  emitters: Record<string, Record<string, unknown> | boolean>
): Record<string, Record<string, unknown>> {
  const processedEmitters: Record<string, Record<string, unknown>> = {};

  for (const [emitter, options] of Object.entries(emitters)) {
    if (options === false) {
      continue;
    }
    processedEmitters[emitter] = options === true ? {} : options;
  }

  return processedEmitters;
}
