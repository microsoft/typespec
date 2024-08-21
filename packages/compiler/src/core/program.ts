import { OutputDirectory, render } from "@alloy-js/core";
import { EmitterOptions } from "../config/types.js";
import { createAssetEmitter } from "../emitter-framework/asset-emitter.js";
import { validateEncodedNamesConflicts } from "../lib/encoded-names.js";
import { MANIFEST } from "../manifest.js";
import {
  deepEquals,
  doIO,
  findProjectRoot,
  isDefined,
  mapEquals,
  mutate,
  resolveTspMain,
} from "../utils/misc.js";
import { createBinder } from "./binder.js";
import { Checker, createChecker } from "./checker.js";
import { createSuppressCodeFix } from "./compiler-code-fixes/suppress.codefix.js";
import { compilerAssert } from "./diagnostics.js";
import { emitFile } from "./emitter-utils.js";
import {
  resolveTypeSpecEntrypoint,
  resolveTypeSpecEntrypointForDir,
} from "./entrypoint-resolution.js";
import { ExternalError } from "./external-error.js";
import { getLibraryUrlsLoaded } from "./library.js";
import { createLinter, resolveLinterDefinition } from "./linter.js";
import { createLogger } from "./logger/index.js";
import { createTracer } from "./logger/tracer.js";
import { createDiagnostic } from "./messages.js";
import {
  ModuleResolutionResult,
  NodePackage,
  ResolveModuleHost,
  ResolvedModule,
  resolveModule,
} from "./module-resolver.js";
import { CompilerOptions } from "./options.js";
import { isImportStatement, parse, parseStandaloneTypeReference } from "./parser.js";
import { getDirectoryPath, joinPaths, resolvePath } from "./path-utils.js";
import { createProjector } from "./projector.js";
import { createSourceFile } from "./source-file.js";
import { StateMap, StateSet, createStateAccessors } from "./state-accessors.js";
import { createTypeFactory } from "./type-factory.js";
import {
  CompilerHost,
  Diagnostic,
  DiagnosticTarget,
  Directive,
  DirectiveExpressionNode,
  EmitContext,
  EmitterFunc,
  Entity,
  JsSourceFileNode,
  LibraryInstance,
  LibraryMetadata,
  LiteralType,
  LocationContext,
  ModuleLibraryMetadata,
  Namespace,
  NoTarget,
  Node,
  NodeFlags,
  ProjectionApplication,
  Projector,
  SourceFile,
  Sym,
  SymbolFlags,
  SymbolTable,
  SyntaxKind,
  Tracer,
  Type,
  TypeSpecLibrary,
  TypeSpecScriptNode,
} from "./types.js";

// the last compiled program
export let currentProgram: Program | undefined;

export interface ProjectedProgram extends Program {
  projector: Projector;
}

export function projectProgram(
  program: Program,
  projections: ProjectionApplication[],
  startNode?: Type
): ProjectedProgram {
  return createProjector(program, projections, startNode);
}

export interface Program {
  compilerOptions: CompilerOptions;
  mainFile?: TypeSpecScriptNode;
  /** All source files in the program, keyed by their file path. */
  sourceFiles: Map<string, TypeSpecScriptNode>;
  jsSourceFiles: Map<string, JsSourceFileNode>;
  literalTypes: Map<string | number | boolean, LiteralType>;
  host: CompilerHost;
  tracer: Tracer;
  trace(area: string, message: string): void;
  typeFactory: ReturnType<typeof createTypeFactory>;
  checker: Checker;
  emitters: EmitterRef[];
  readonly diagnostics: readonly Diagnostic[];
  loadTypeSpecScript(typespecScript: SourceFile): Promise<TypeSpecScriptNode>;
  onValidate(
    cb: (program: Program) => void | Promise<void>,
    LibraryMetadata: LibraryMetadata
  ): void;
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
  resolveTypeReference(reference: string): [Type | undefined, readonly Diagnostic[]];

  /** Return location context of the given source file. */
  getSourceFileLocationContext(sourceFile: SourceFile): LocationContext;

  /**
   * Project root. If a tsconfig was found/specified this is the directory for the tsconfig.json. Otherwise directory where the entrypoint is located.
   */
  readonly projectRoot: string;
}

interface EmitterRef {
  emitFunction: EmitterFunc;
  main: string;
  metadata: LibraryMetadata;
  emitterOutputDir: string;
  options: Record<string, unknown>;
}

interface Validator {
  metadata: LibraryMetadata;
  callback: (program: Program) => void | Promise<void>;
}

interface TypeSpecLibraryReference {
  path: string;
  manifest: NodePackage;
}

export async function compile(
  host: CompilerHost,
  mainFile: string,
  options: CompilerOptions = {},
  oldProgram?: Program // NOTE: deliberately separate from options to avoid memory leak by chaining all old programs together.
): Promise<Program> {
  const validateCbs: Validator[] = [];
  const stateMaps = new Map<symbol, StateMap>();
  const stateSets = new Map<symbol, StateSet>();
  const diagnostics: Diagnostic[] = [];
  const seenSourceFiles = new Set<string>();
  const duplicateSymbols = new Set<Sym>();
  const emitters: EmitterRef[] = [];
  const requireImports = new Map<string, string>();
  const loadedLibraries = new Map<string, TypeSpecLibraryReference>();
  const sourceFileLocationContexts = new WeakMap<SourceFile, LocationContext>();
  let error = false;
  let continueToNextStage = true;

  const logger = createLogger({ sink: host.logSink });
  const tracer = createTracer(logger, { filter: options.trace });
  const resolvedMain = await resolveTypeSpecEntrypoint(host, mainFile, reportDiagnostic);

  const program: Program = {
    checker: undefined!,
    compilerOptions: resolveOptions(options),
    sourceFiles: new Map(),
    jsSourceFiles: new Map(),
    literalTypes: new Map(),
    host,
    diagnostics,
    emitters,
    loadTypeSpecScript,
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
    onValidate(cb, metadata) {
      validateCbs.push({ callback: cb, metadata });
    },
    getGlobalNamespaceType,
    resolveTypeReference,
    getSourceFileLocationContext,
    projectRoot: getDirectoryPath(options.config ?? resolvedMain ?? ""),
    typeFactory: undefined!, // todo: check
  };

  trace("compiler.options", JSON.stringify(options, null, 2));

  function trace(area: string, message: string) {
    tracer.trace(area, message);
  }
  const binder = createBinder(program);

  await loadIntrinsicTypes();
  if (!options?.nostdlib) {
    await loadStandardLibrary();
  }

  // Load additional imports prior to compilation
  if (resolvedMain && options.additionalImports) {
    const importScript = options.additionalImports.map((i) => `import "${i}";`).join("\n");
    const sourceFile = createSourceFile(
      importScript,
      joinPaths(getDirectoryPath(resolvedMain), `__additional_imports`)
    );
    sourceFileLocationContexts.set(sourceFile, { type: "project" });
    await loadTypeSpecScript(sourceFile);
  }

  if (resolvedMain) {
    await loadMain(resolvedMain);
  } else {
    return program;
  }

  const basedir = getDirectoryPath(resolvedMain);

  let emit = options.emit;
  let emitterOptions = options.options;
  /* eslint-disable deprecation/deprecation */
  if (options.emitters) {
    emit ??= Object.keys(options.emitters);
    emitterOptions ??= options.emitters;
  }
  /* eslint-enable deprecation/deprecation */

  await loadEmitters(basedir, emit ?? [], emitterOptions ?? {});

  if (
    oldProgram &&
    mapEquals(oldProgram.sourceFiles, program.sourceFiles) &&
    deepEquals(oldProgram.compilerOptions, program.compilerOptions)
  ) {
    return oldProgram;
  }

  // let GC reclaim old program, we do not reuse it beyond this point.
  oldProgram = undefined;
  currentProgram = program;
  const linter = createLinter(program, (name) => loadLibrary(basedir, name));
  if (options.linterRuleSet) {
    program.reportDiagnostics(await linter.extendRuleSet(options.linterRuleSet));
  }
  program.checker = createChecker(program);
  program.checker.checkProgram();
  program.typeFactory = createTypeFactory(program);

  if (!continueToNextStage) {
    return program;
  }
  // onValidate stage
  await runValidators();

  validateRequiredImports();

  await validateLoadedLibraries();
  if (!continueToNextStage) {
    return program;
  }

  // Linter stage
  program.reportDiagnostics(linter.lint());

  // Emitter stage
  for (const instance of emitters) {
    await runEmitter(instance);
  }

  return program;

  /**
   * Validate the libraries loaded during the compilation process are compatible.
   */
  async function validateLoadedLibraries() {
    const loadedRoots = new Set<string>();
    // Check all the files that were loaded
    for (const fileUrl of getLibraryUrlsLoaded()) {
      if (fileUrl.startsWith("file:")) {
        const root = await findProjectRoot(host.stat, host.fileURLToPath(fileUrl));
        if (root) {
          loadedRoots.add(root);
        }
      }
    }

    const libraries = new Map([...loadedLibraries.entries()]);
    const incompatibleLibraries = new Map<string, TypeSpecLibraryReference[]>();
    for (const root of loadedRoots) {
      const packageJsonPath = joinPaths(root, "package.json");
      try {
        const packageJson: NodePackage = JSON.parse((await host.readFile(packageJsonPath)).text);
        const found = libraries.get(packageJson.name);
        if (found && found.path !== root && found.manifest.version !== packageJson.version) {
          let incompatibleIndex: TypeSpecLibraryReference[] | undefined = incompatibleLibraries.get(
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

  async function loadIntrinsicTypes() {
    const locationContext: LocationContext = { type: "compiler" };
    await loadTypeSpecFile(
      resolvePath(host.getExecutionRoot(), "lib/intrinsics.tsp"),
      locationContext,
      NoTarget
    );
  }

  async function loadStandardLibrary() {
    const locationContext: LocationContext = { type: "compiler" };
    for (const dir of host.getLibDirs()) {
      await loadDirectory(dir, locationContext, NoTarget);
    }
  }

  async function loadDirectory(
    dir: string,
    locationContext: LocationContext,
    diagnosticTarget: DiagnosticTarget | typeof NoTarget
  ): Promise<string> {
    const mainFile = await resolveTypeSpecEntrypointForDir(host, dir, reportDiagnostic);
    await loadTypeSpecFile(mainFile, locationContext, diagnosticTarget);
    return mainFile;
  }

  async function loadTypeSpecFile(
    path: string,
    locationContext: LocationContext,
    diagnosticTarget: DiagnosticTarget | typeof NoTarget
  ) {
    if (seenSourceFiles.has(path)) {
      return;
    }
    seenSourceFiles.add(path);

    const file = await doIO(host.readFile, path, program.reportDiagnostic, {
      diagnosticTarget,
    });

    if (file) {
      sourceFileLocationContexts.set(file, locationContext);
      await loadTypeSpecScript(file);
    }
  }

  async function loadJsFile(
    path: string,
    locationContext: LocationContext,
    diagnosticTarget: DiagnosticTarget | typeof NoTarget
  ): Promise<JsSourceFileNode | undefined> {
    const sourceFile = program.jsSourceFiles.get(path);
    if (sourceFile !== undefined) {
      return sourceFile;
    }

    const file = createSourceFile("", path);
    sourceFileLocationContexts.set(file, locationContext);
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
  async function importJsFile(
    path: string,
    locationContext: LocationContext,
    diagnosticTarget: DiagnosticTarget | typeof NoTarget
  ) {
    const file = await loadJsFile(path, locationContext, diagnosticTarget);
    if (file !== undefined) {
      program.jsSourceFiles.set(path, file);
      binder.bindJsSourceFile(file);
    }
  }

  async function loadTypeSpecScript(file: SourceFile): Promise<TypeSpecScriptNode> {
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

  function parseOrReuse(file: SourceFile): TypeSpecScriptNode {
    const old = oldProgram?.sourceFiles.get(file.path) ?? host?.parseCache?.get(file);
    if (old?.file === file && deepEquals(old.parseOptions, options.parseOptions)) {
      return old;
    }
    const script = parse(file, options.parseOptions);
    host.parseCache?.set(file, script);
    return script;
  }

  async function loadScriptImports(file: TypeSpecScriptNode) {
    // collect imports
    const basedir = getDirectoryPath(file.file.path);
    await loadImports(
      file.statements.filter(isImportStatement).map((x) => ({ path: x.path.value, target: x })),
      basedir,
      getSourceFileLocationContext(file.file)
    );
  }

  function getSourceFileLocationContext(sourcefile: SourceFile): LocationContext {
    const locationContext = sourceFileLocationContexts.get(sourcefile);
    compilerAssert(locationContext, "SourceFile should have a declaration locationContext.");
    return locationContext;
  }

  async function loadImports(
    imports: Array<{ path: string; target: DiagnosticTarget | typeof NoTarget }>,
    relativeTo: string,
    locationContext: LocationContext
  ) {
    // collect imports
    for (const { path, target } of imports) {
      await loadImport(path, target, relativeTo, locationContext);
    }
  }

  async function loadImport(
    path: string,
    target: DiagnosticTarget | typeof NoTarget,
    relativeTo: string,
    locationContext: LocationContext
  ) {
    const library = await resolveTypeSpecLibrary(path, relativeTo, target);
    if (library === undefined) {
      return;
    }
    if (library.type === "module") {
      loadedLibraries.set(library.manifest.name, {
        path: library.path,
        manifest: library.manifest,
      });
      trace("import-resolution.library", `Loading library "${path}" from "${library.mainFile}"`);

      const metadata = computeModuleMetadata(library);
      locationContext = {
        type: "library",
        metadata,
      };
    }
    const importFilePath = library.type === "module" ? library.mainFile : library.path;

    const isDirectory = (await host.stat(importFilePath)).isDirectory();
    if (isDirectory) {
      return await loadDirectory(importFilePath, locationContext, target);
    }

    const sourceFileKind = host.getSourceFileKind(importFilePath);

    switch (sourceFileKind) {
      case "js":
        return await importJsFile(importFilePath, locationContext, target);
      case "typespec":
        return await loadTypeSpecFile(importFilePath, locationContext, target);
      default:
        program.reportDiagnostic(createDiagnostic({ code: "invalid-import", target }));
    }
  }

  async function loadEmitters(
    basedir: string,
    emitterNameOrPaths: string[],
    emitterOptions: Record<string, EmitterOptions>
  ) {
    for (const emitterNameOrPath of emitterNameOrPaths) {
      const emitter = await loadEmitter(basedir, emitterNameOrPath, emitterOptions);
      if (emitter) {
        emitters.push(emitter);
      }
    }
  }

  async function resolveEmitterModuleAndEntrypoint(
    basedir: string,
    emitterNameOrPath: string
  ): Promise<
    [
      { module: ModuleResolutionResult; entrypoint: JsSourceFileNode | undefined } | undefined,
      readonly Diagnostic[],
    ]
  > {
    const locationContext: LocationContext = { type: "project" };
    // attempt to resolve a node module with this name
    const [module, diagnostics] = await resolveJSLibrary(
      emitterNameOrPath,
      basedir,
      locationContext
    );
    if (!module) {
      return [undefined, diagnostics];
    }

    const entrypoint = module.type === "file" ? module.path : module.mainFile;
    const file = await loadJsFile(entrypoint, locationContext, NoTarget);

    return [{ module, entrypoint: file }, []];
  }

  async function loadLibrary(
    basedir: string,
    libraryNameOrPath: string
  ): Promise<LibraryInstance | undefined> {
    const [resolution, diagnostics] = await resolveEmitterModuleAndEntrypoint(
      basedir,
      libraryNameOrPath
    );

    if (resolution === undefined) {
      program.reportDiagnostics(diagnostics);
      return undefined;
    }
    const { module, entrypoint } = resolution;

    const libDefinition: TypeSpecLibrary<any> | undefined = entrypoint?.esmExports.$lib;
    const metadata = computeLibraryMetadata(module, libDefinition);
    // eslint-disable-next-line deprecation/deprecation
    const linterDef = entrypoint?.esmExports.$linter ?? libDefinition?.linter;
    return {
      ...resolution,
      metadata,
      definition: libDefinition,
      linter: linterDef && resolveLinterDefinition(libraryNameOrPath, linterDef),
    };
  }

  async function loadEmitter(
    basedir: string,
    emitterNameOrPath: string,
    emittersOptions: Record<string, EmitterOptions>
  ): Promise<EmitterRef | undefined> {
    const library = await loadLibrary(basedir, emitterNameOrPath);

    if (library === undefined) {
      return undefined;
    }

    const { entrypoint, metadata } = library;
    if (entrypoint === undefined) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-emitter",
          format: { emitterPackage: emitterNameOrPath },
          target: NoTarget,
        })
      );
      return undefined;
    }

    const emitFunction = entrypoint.esmExports.$onEmit;
    const libDefinition = library.definition;

    let { "emitter-output-dir": emitterOutputDir, ...emitterOptions } =
      emittersOptions[metadata.name ?? emitterNameOrPath] ?? {};
    if (emitterOutputDir === undefined) {
      emitterOutputDir = [options.outputDir, metadata.name].filter(isDefined).join("/");
    }
    if (libDefinition?.requireImports) {
      for (const lib of libDefinition.requireImports) {
        requireImports.set(lib, libDefinition.name);
      }
    }
    if (emitFunction !== undefined) {
      if (libDefinition?.emitter?.options) {
        const diagnostics = libDefinition?.emitterOptionValidator?.validate(
          emitterOptions,
          options.configFile?.file
            ? {
                kind: "path-target",
                path: ["options", emitterNameOrPath],
                script: options.configFile.file,
              }
            : NoTarget
        );
        if (diagnostics && diagnostics.length > 0) {
          program.reportDiagnostics(diagnostics);
          return;
        }
      }
      return {
        main: entrypoint.file.path,
        emitFunction,
        metadata,
        emitterOutputDir,
        options: emitterOptions,
      };
    } else {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-emitter",
          format: { emitterPackage: emitterNameOrPath },
          target: NoTarget,
        })
      );
      return undefined;
    }
  }

  function computeLibraryMetadata(
    module: ModuleResolutionResult,
    libDefinition: TypeSpecLibrary<any> | undefined
  ): LibraryMetadata {
    if (module.type === "file") {
      return {
        type: "file",
        name: libDefinition?.name,
      };
    }

    return computeModuleMetadata(module);
  }

  function computeModuleMetadata(module: ResolvedModule): ModuleLibraryMetadata {
    const metadata: ModuleLibraryMetadata = {
      type: "module",
      name: module.manifest.name,
    };

    if (module.manifest.homepage) {
      metadata.homepage = module.manifest.homepage;
    }
    if (module.manifest.bugs?.url) {
      metadata.bugs = { url: module.manifest.bugs?.url };
    }
    if (module.manifest.version) {
      metadata.version = module.manifest.version;
    }

    return metadata;
  }

  /**
   * @param emitter Emitter ref to run
   */
  async function runEmitter(emitter: EmitterRef) {
    const context: EmitContext<any> = {
      program,
      emitterOutputDir: emitter.emitterOutputDir,
      options: emitter.options,
      getAssetEmitter(TypeEmitterClass) {
        return createAssetEmitter(program, TypeEmitterClass, this);
      },
    };
    try {
      const result = (await emitter.emitFunction(context)) as any;
      if (typeof result === "function") {
        // assume this is an alloy component
        const tree = render(result);
        await writeOutputDirectory(tree);
      }
    } catch (error: unknown) {
      throw new ExternalError({ kind: "emitter", metadata: emitter.metadata, error });
    }
  }

  async function writeOutputDirectory(dir: OutputDirectory) {
    for (const sub of dir.contents) {
      if (Array.isArray(sub.contents)) {
        await writeOutputDirectory(sub as OutputDirectory);
      } else {
        await emitFile(program, {
          content: sub.contents as string,
          path: sub.path,
        });
      }
    }
  }
  async function runValidators() {
    runCompilerValidators();
    for (const validator of validateCbs) {
      await runValidator(validator);
    }
  }

  async function runValidator(validator: Validator) {
    try {
      await validator.callback(program);
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
        throw new ExternalError({ kind: "validator", metadata: validator.metadata, error });
      }
    }
  }

  /** Run the compiler built-in validators */
  function runCompilerValidators() {
    validateEncodedNamesConflicts(program);
  }

  function validateRequiredImports() {
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
  }

  /**
   * resolves a module specifier like "myLib" to an absolute path where we can find the main of
   * that module, e.g. "/typespec/node_modules/myLib/main.tsp".
   */
  async function resolveTypeSpecLibrary(
    specifier: string,
    baseDir: string,
    target: DiagnosticTarget | typeof NoTarget
  ): Promise<ModuleResolutionResult | undefined> {
    try {
      return await resolveModule(getResolveModuleHost(), specifier, {
        baseDir,
        directoryIndexFiles: ["main.tsp", "index.mjs", "index.js"],
        resolveMain(pkg) {
          // this lets us follow node resolve semantics more-or-less exactly
          // but using tspMain instead of main.
          return resolveTspMain(pkg) ?? pkg.main;
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
            messageId: "tspMain",
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
   * that module, e.g. "/typespec/node_modules/myLib/dist/lib.js".
   */
  async function resolveJSLibrary(
    specifier: string,
    baseDir: string,
    locationContext: LocationContext
  ): Promise<[ModuleResolutionResult | undefined, readonly Diagnostic[]]> {
    try {
      return [await resolveModule(getResolveModuleHost(), specifier, { baseDir }), []];
    } catch (e: any) {
      if (e.code === "MODULE_NOT_FOUND") {
        return [
          undefined,
          [
            createDiagnostic({
              code: "import-not-found",
              format: { path: specifier },
              target: NoTarget,
            }),
          ],
        ];
      } else if (e.code === "INVALID_MAIN") {
        return [
          undefined,
          [
            createDiagnostic({
              code: "library-invalid",
              format: { path: specifier },
              target: NoTarget,
            }),
          ],
        ];
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
   * Load the main file from the given path
   * @param mainPath Absolute path to the main file.
   */
  async function loadMain(mainPath: string): Promise<void> {
    await checkForCompilerVersionMismatch(mainPath);
    const sourceFileKind = host.getSourceFileKind(mainPath);

    const locationContext: LocationContext = { type: "project" };
    switch (sourceFileKind) {
      case "js":
        return await importJsFile(mainPath, locationContext, NoTarget);
      case "typespec":
        return await loadTypeSpecFile(mainPath, locationContext, NoTarget);
      default:
        program.reportDiagnostic(createDiagnostic({ code: "invalid-main", target: NoTarget }));
    }
  }

  // It's important that we use the compiler version that resolves locally
  // from the input TypeSpec source location. Otherwise, there will be undefined
  // runtime behavior when decorators and handlers expect a
  // different version of TypeSpec than the current one. Abort the compilation
  // with an error if the TypeSpec entry point resolves to a different local
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
        "@typespec/compiler",
        { baseDir }
      );
      compilerAssert(
        resolved.type === "module",
        `Expected to have resolved "@typespec/compiler" to a node module.`
      );
      actual = resolved;
    } catch (err: any) {
      if (err.code === "MODULE_NOT_FOUND" || err.code === "INVALID_MAIN") {
        return true; // no local typespec, ok to use any compiler
      }
      throw err;
    }

    const expected = host.getExecutionRoot();

    if (actual.path !== expected && MANIFEST.version !== actual.manifest.version) {
      const betterTypeSpecServerPath = actual.path;
      program.reportDiagnostic(
        createDiagnostic({
          code: "compiler-version-mismatch",
          format: { basedir: baseDir, betterTypeSpecServerPath, actual: actual.path, expected },
          target: NoTarget,
        })
      );
      return false;
    }

    return true;
  }

  function getOption(key: string): string | undefined {
    return (options.miscOptions || {})[key] as any;
  }

  function reportDiagnostic(diagnostic: Diagnostic): void {
    if (shouldSuppress(diagnostic)) {
      return;
    }

    if (diagnostic.severity === "error") {
      continueToNextStage = false;
    }

    if (diagnostic.severity === "warning" && diagnostic.target !== NoTarget) {
      mutate(diagnostic).codefixes ??= [];
      mutate(diagnostic.codefixes).push(createSuppressCodeFix(diagnostic.target, diagnostic.code));
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
      case "deprecated":
        return { name: "deprecated", message: args[0], node };
      default:
        throw new Error("Unexpected directive name.");
    }
  }

  function getNode(target: Node | Entity | Sym): Node | undefined {
    if (!("kind" in target) && !("valueKind" in target) && !("entityKind" in target)) {
      // symbol
      if (target.flags & SymbolFlags.Using) {
        return target.symbolSource!.declarations[0];
      }

      return target.declarations[0]; // handle multiple decls
    } else if ("kind" in target && typeof target.kind === "number") {
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
    return program.checker.getGlobalNamespaceType();
  }

  function resolveTypeReference(reference: string): [Type | undefined, readonly Diagnostic[]] {
    const [node, parseDiagnostics] = parseStandaloneTypeReference(reference);
    if (parseDiagnostics.length > 0) {
      return [undefined, parseDiagnostics];
    }
    const binder = createBinder(program);
    binder.bindNode(node);
    mutate(node).parent = program.checker.getGlobalNamespaceNode();

    return program.checker.resolveTypeReference(node);
  }
}

/**
 * Resolve compiler options from input options.
 */
function resolveOptions(options: CompilerOptions): CompilerOptions {
  // eslint-disable-next-line deprecation/deprecation
  const outputDir = options.outputDir ?? options.outputPath;
  return {
    ...options,
    outputDir,
    outputPath: outputDir,
  };
}
