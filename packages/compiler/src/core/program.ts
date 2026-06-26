import pc from "picocolors";
import { EmitterOptions } from "../config/types.js";
import { validateEncodedNamesConflicts } from "../lib/encoded-names.js";
import { validatePagingOperations } from "../lib/paging.js";
import { MANIFEST } from "../manifest.js";
import { ResolveModuleError, resolveModule } from "../module-resolver/module-resolver.js";
import { ModuleResolutionResult, ResolvedModule } from "../module-resolver/types.js";
import { PackageJson } from "../types/package-json.js";
import { findProjectRoot } from "../utils/io.js";
import { deepEquals, isDefined, mapEquals, mutate } from "../utils/misc.js";
import { createBinder } from "./binder.js";
import { Checker, createChecker } from "./checker.js";
import { createSuppressCodeFix } from "./compiler-code-fixes/suppress.codefix.js";
import { compilerAssert } from "./diagnostics.js";
import { getEmittedFilesForProgram } from "./emitter-utils.js";
import { resolveTypeSpecEntrypoint } from "./entrypoint-resolution.js";
import { ExternalError } from "./external-error.js";
import { getLibraryUrlsLoaded } from "./library.js";
import {
  builtInLinterLibraryName,
  createBuiltInLinterLibrary,
  createLinter,
  resolveLinterDefinition,
} from "./linter.js";
import { createLogger } from "./logger/index.js";
import { createTracer } from "./logger/tracer.js";
import { createDiagnostic } from "./messages.js";
import { createResolveModuleHost } from "./module-host.js";
import { NameResolver, createResolver } from "./name-resolver.js";
import { Numeric } from "./numeric.js";
import { CompilerOptions } from "./options.js";
import { parse, parseStandaloneTypeReference } from "./parser.js";
import { getDirectoryPath, joinPaths, resolvePath } from "./path-utils.js";
import { createPerfReporter, perf } from "./perf.js";
import { formatPermission } from "./permissions/permission-set.js";
import { formatGrantSuggestion, resolvePermissions } from "./permissions/resolve.js";
import {
  deserializeDiagnostic,
  serializeDiagnostic,
  type SandboxEmitResult,
} from "./permissions/sandbox/emit-protocol.js";
import { runEmitterSandboxed } from "./permissions/sandbox/emit-runner.js";
import { resolveRealpath } from "./permissions/sandbox/runtime.js";
import {
  SourceLoader,
  SourceResolution,
  createSourceLoader,
  loadJsFile,
  moduleResolutionErrorToDiagnostic,
} from "./source-loader.js";
import { createStateAccessors } from "./state-accessors.js";
import { ComplexityStats, RuntimeStats, Stats } from "./stats.js";
import {
  SuppressionTracker,
  createSuppressionTracker,
  findDirectiveSuppressingOnNode,
} from "./suppression-tracking.js";
import {
  CompilerHost,
  Diagnostic,
  EmitContext,
  EmitterFunc,
  Entity,
  JsSourceFileNode,
  LibraryInstance,
  LibraryMetadata,
  LiteralType,
  LocationContext,
  LogSink,
  ModuleLibraryMetadata,
  Namespace,
  NoTarget,
  Node,
  PerfReporter,
  SourceFile,
  Sym,
  SymbolFlags,
  SymbolTable,
  TemplateInstanceTarget,
  Tracer,
  Type,
  TypeSpecLibrary,
  TypeSpecScriptNode,
} from "./types.js";

export interface Program {
  compilerOptions: CompilerOptions;
  /** @internal */
  mainFile?: TypeSpecScriptNode;
  /** All source files in the program, keyed by their file path. */
  sourceFiles: Map<string, TypeSpecScriptNode>;
  jsSourceFiles: Map<string, JsSourceFileNode>;

  /** @internal */
  literalTypes: Map<string | number | boolean | Numeric, LiteralType>;
  host: CompilerHost;
  tracer: Tracer;
  trace(area: string, message: string): void;
  /**
   * **DANGER** Using the checker is reserved for advanced usage and should be used with caution.
   * API are not subject to the same stability guarantees see See https://typespec.io/docs/handbook/breaking-change-policy/
   */
  checker: Checker;
  /** @internal */
  resolver: NameResolver;

  emitters: EmitterRef[];
  readonly diagnostics: readonly Diagnostic[];
  /** @internal */
  loadTypeSpecScript(typespecScript: SourceFile): Promise<TypeSpecScriptNode>;
  /** @internal */
  onValidate(
    cb: (program: Program) => void | Promise<void>,
    LibraryMetadata: LibraryMetadata,
  ): void;
  /** @internal */
  getOption(key: string): string | undefined;
  stateSet(key: symbol): Set<Type>;
  /** @internal */
  stateSets: Map<symbol, Set<Type>>;
  stateMap(key: symbol): Map<Type, any>;
  /**@internal */
  stats: Stats;
  /** @internal */
  stateMaps: Map<symbol, Map<Type, unknown>>;
  hasError(): boolean;
  reportDiagnostic(diagnostic: Diagnostic): void;
  reportDiagnostics(diagnostics: readonly Diagnostic[]): void;

  /** @internal */
  reportDuplicateSymbols(symbols: SymbolTable | undefined): void;
  /** @internal */
  readonly suppressionTracker: SuppressionTracker | undefined;

  getGlobalNamespaceType(): Namespace;

  resolveTypeReference(reference: string): [Type | undefined, readonly Diagnostic[]];

  /** @internal */
  resolveTypeOrValueReference(reference: string): [Entity | undefined, readonly Diagnostic[]];

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
  readonly library: LibraryInstance;
}

interface Validator {
  metadata: LibraryMetadata;
  callback: (
    program: Program,
  ) => void | readonly Diagnostic[] | Promise<void> | Promise<readonly Diagnostic[]>;
}

interface TypeSpecLibraryReference {
  path: string;
  manifest: PackageJson;
}

export async function compile(
  host: CompilerHost,
  mainFile: string,
  options: CompilerOptions = {},
  oldProgram?: Program, // NOTE: deliberately separate from options to avoid memory leak by chaining all old programs together.
) {
  const logger = createLogger({ sink: host.logSink });
  const { program, shouldAbort } = await logger.trackAction(
    "Compiling...",
    "Compiling",
    async (task) => {
      const result = await createProgram(host, mainFile, options, oldProgram);
      if (result.program.hasError()) {
        task.fail();
      } else if (result.program.diagnostics.length > 0) {
        task.warn();
      }
      return result;
    },
  );

  if (shouldAbort) {
    return program;
  }

  const emitStats: RuntimeStats["emit"] = {
    total: 0,
    emitters: {},
  };
  const timer = perf.startTimer();
  // Emitter stage
  for (const emitter of program.emitters) {
    // If in dry mode run and an emitter doesn't support it we have to skip it.
    if (program.compilerOptions.dryRun && !emitter.library.definition?.capabilities?.dryRun) {
      continue;
    }
    if (options.sandbox) {
      const emitterStats = await emitSandboxed(emitter, program, host, mainFile, options);
      if (emitterStats) {
        emitStats.emitters[emitter.metadata.name ?? "<unnamed>"] = emitterStats;
      }
      if (options.listFiles) {
        logEmittedFilesPath(program);
      }
    } else {
      const emitterStats = await emit(emitter, program);
      emitStats.emitters[emitter.metadata.name ?? "<unnamed>"] = emitterStats;
      if (options.listFiles) {
        logEmittedFilesPath(program);
      }
    }
  }
  emitStats.total = timer.end();
  program.stats.runtime.emit = emitStats;
  return program;
}

async function createProgram(
  host: CompilerHost,
  mainFile: string,
  options: CompilerOptions = {},
  oldProgram?: Program,
): Promise<{ program: Program; shouldAbort: boolean }> {
  const runtimeStats: Partial<RuntimeStats> = {};
  const validateCbs: Validator[] = [];
  const stateMaps = new Map<symbol, Map<Type, unknown>>();
  const stateSets = new Map<symbol, Set<Type>>();
  const diagnostics: Diagnostic[] = [];
  const duplicateSymbols = new Set<Sym>();
  const emitters: EmitterRef[] = [];
  const requireImports = new Map<string, string>();
  const complexityStats: ComplexityStats = {} as any;
  let sourceResolution: SourceResolution = undefined!;
  let error = false;
  let continueToNextStage = true;
  // eslint-disable-next-line prefer-const -- reassigned after source resolution
  let suppressionTracker: SuppressionTracker | undefined;

  const logger = createLogger({ sink: host.logSink });
  const tracer = createTracer(logger, { filter: options.trace });
  const resolvedMain = await resolveTypeSpecEntrypoint(host, mainFile, reportDiagnostic);
  const program: Program = {
    checker: undefined!,
    resolver: undefined!,
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
    stats: {
      complexity: complexityStats,
      runtime: runtimeStats as any,
    },

    tracer,
    trace,
    ...createStateAccessors(stateMaps, stateSets),
    reportDiagnostic,
    reportDiagnostics,
    reportDuplicateSymbols,
    get suppressionTracker() {
      return suppressionTracker;
    },
    hasError() {
      return error;
    },
    onValidate(cb, metadata) {
      validateCbs.push({ callback: cb, metadata });
    },
    getGlobalNamespaceType,
    resolveTypeReference,
    /** @internal */
    resolveTypeOrValueReference,
    getSourceFileLocationContext,
    projectRoot: getDirectoryPath(options.config ?? resolvedMain ?? ""),
  };

  trace("compiler.options", JSON.stringify(options, null, 2));

  function trace(area: string, message: string) {
    tracer.trace(area, message);
  }
  const binder = createBinder(program);

  if (resolvedMain === undefined) {
    return { program, shouldAbort: true };
  }
  const basedir = getDirectoryPath(resolvedMain) || "/";
  await checkForCompilerVersionMismatch(basedir);

  runtimeStats.loader = await perf.timeAsync(() => loadSources(resolvedMain));

  const emit = options.noEmit ? [] : (options.emit ?? []);
  const emitterOptions = options.options;

  await loadEmitters(basedir, emit, emitterOptions ?? {});

  if (
    oldProgram &&
    mapEquals(oldProgram.sourceFiles, program.sourceFiles) &&
    deepEquals(oldProgram.compilerOptions, program.compilerOptions)
  ) {
    return { program: oldProgram, shouldAbort: true };
  }

  // let GC reclaim old program, we do not reuse it beyond this point.
  oldProgram = undefined;

  suppressionTracker = createSuppressionTracker(sourceResolution);

  const resolver = (program.resolver = createResolver(program));
  runtimeStats.resolver = perf.time(() => resolver.resolveProgram());

  const linter = createLinter(program, (name) => loadLibrary(basedir, name));
  linter.registerLinterLibrary(builtInLinterLibraryName, createBuiltInLinterLibrary());
  if (options.linterRuleSet) {
    program.reportDiagnostics(await linter.extendRuleSet(options.linterRuleSet));
  }

  program.checker = createChecker(program, resolver);
  runtimeStats.checker = perf.time(() => program.checker.checkProgram());

  complexityStats.createdTypes = program.checker.stats.createdTypes;
  complexityStats.finishedTypes = program.checker.stats.finishedTypes;

  if (!continueToNextStage) {
    return { program, shouldAbort: true };
  }

  // onValidate stage
  await runValidators();

  validateRequiredImports();

  await validateLoadedLibraries();

  if (!continueToNextStage) {
    return { program, shouldAbort: true };
  }

  // Linter stage
  const lintResult = await linter.lint();
  runtimeStats.linter = lintResult.stats.runtime;
  program.reportDiagnostics(lintResult.diagnostics);

  return { program, shouldAbort: false };

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

    const libraries = new Map([...sourceResolution.loadedLibraries.entries()]);
    const incompatibleLibraries = new Map<string, TypeSpecLibraryReference[]>();
    for (const root of loadedRoots) {
      const packageJsonPath = joinPaths(root, "package.json");
      try {
        const packageJson: PackageJson = JSON.parse((await host.readFile(packageJsonPath)).text);
        if (packageJson.name) {
          const found = libraries.get(packageJson.name);
          if (found && found.path !== root && found.manifest.version !== packageJson.version) {
            let incompatibleIndex: TypeSpecLibraryReference[] | undefined =
              incompatibleLibraries.get(packageJson.name);
            if (incompatibleIndex === undefined) {
              incompatibleIndex = [found];
              incompatibleLibraries.set(packageJson.name, incompatibleIndex);
            }
            incompatibleIndex.push({ path: root, manifest: packageJson });
          }
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
        }),
      );
    }
  }

  async function loadSources(entrypoint: string) {
    const sourceLoader = await createSourceLoader(host, {
      parseOptions: options.parseOptions,
      tracer,
      getCachedScript: (file) =>
        oldProgram?.sourceFiles.get(file.path) ?? host.parseCache?.get(file),
    });

    // intrinsic.tsp
    await loadIntrinsicTypes(sourceLoader);

    // standard library
    if (!options?.nostdlib) {
      await loadStandardLibrary(sourceLoader);
    }

    // main entrypoint
    await sourceLoader.importFile(entrypoint, NoTarget, { type: "project" }, "entrypoint");

    // additional imports
    for (const additionalImport of options?.additionalImports ?? []) {
      await sourceLoader.importPath(additionalImport, NoTarget, getDirectoryPath(entrypoint), {
        type: "project",
      });
    }

    sourceResolution = sourceLoader.resolution;

    program.sourceFiles = sourceResolution.sourceFiles;
    program.jsSourceFiles = sourceResolution.jsSourceFiles;

    // Bind
    for (const file of sourceResolution.sourceFiles.values()) {
      binder.bindSourceFile(file);
    }
    for (const jsFile of sourceResolution.jsSourceFiles.values()) {
      binder.bindJsSourceFile(jsFile);
    }
    program.reportDiagnostics(sourceResolution.diagnostics);
  }

  async function loadIntrinsicTypes(loader: SourceLoader) {
    const locationContext: LocationContext = { type: "compiler" };
    return loader.importFile(
      resolvePath(host.getExecutionRoot(), "lib/intrinsics.tsp"),
      NoTarget,
      locationContext,
    );
  }

  async function loadStandardLibrary(loader: SourceLoader) {
    const locationContext: LocationContext = { type: "compiler" };
    for (const dir of host.getLibDirs()) {
      await loader.importFile(resolvePath(dir, "main.tsp"), NoTarget, locationContext);
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

  function getSourceFileLocationContext(sourcefile: SourceFile): LocationContext {
    const locationContext = sourceResolution.locationContexts.get(sourcefile);
    compilerAssert(locationContext, "SourceFile should have a declaration locationContext.");
    return locationContext;
  }

  async function loadEmitters(
    basedir: string,
    emitterNameOrPaths: string[],
    emitterOptions: Record<string, EmitterOptions>,
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
    specifier: string,
  ): Promise<
    [
      { module: ModuleResolutionResult; entrypoint: JsSourceFileNode } | undefined,
      readonly Diagnostic[],
    ]
  > {
    const locationContext: LocationContext = { type: "project" };
    // attempt to resolve a node module with this name
    const [module, diagnostics] = await resolveJSLibrary(specifier, basedir, locationContext);
    if (!module) {
      return [undefined, diagnostics];
    }

    const entrypoint = module.type === "file" ? module.path : module.mainFile;
    const [file, jsDiagnostics] = await loadJsFile(host, entrypoint, NoTarget);
    return [file && { module, entrypoint: file }, jsDiagnostics];
  }

  async function loadLibrary(
    basedir: string,
    libraryNameOrPath: string,
  ): Promise<LibraryInstance | undefined> {
    const [resolution, diagnostics] = await resolveEmitterModuleAndEntrypoint(
      basedir,
      libraryNameOrPath,
    );

    if (resolution === undefined) {
      program.reportDiagnostics(diagnostics);
      return undefined;
    }
    const { module, entrypoint } = resolution;

    const libDefinition: TypeSpecLibrary<any> | undefined = entrypoint?.esmExports.$lib;
    const metadata = computeLibraryMetadata(module, libDefinition);
    const linterDef = entrypoint?.esmExports.$linter;
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
    emittersOptions: Record<string, EmitterOptions>,
  ): Promise<EmitterRef | undefined> {
    const library = await loadLibrary(basedir, emitterNameOrPath);

    if (library === undefined) {
      return undefined;
    }

    const { entrypoint, metadata } = library;
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
            : NoTarget,
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
        library,
      };
    } else {
      program.trace(
        "emitter.load.invalid-emitter",
        `Emitter does not have an emit function. Available exported symbols are ${Object.keys(entrypoint.esmExports).join(", ")}`,
      );
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-emitter",
          format: {
            emitterPackage: emitterNameOrPath,
          },
          target: NoTarget,
        }),
      );
      return undefined;
    }
  }

  function computeLibraryMetadata(
    module: ModuleResolutionResult,
    libDefinition: TypeSpecLibrary<any> | undefined,
  ): LibraryMetadata {
    if (module.type === "file") {
      return {
        type: "file",
        name: libDefinition?.name,
        permissions: libDefinition?.permissions,
      };
    }

    return computeModuleMetadata(module, libDefinition);
  }

  function computeModuleMetadata(
    module: ResolvedModule,
    libDefinition: TypeSpecLibrary<any> | undefined,
  ): ModuleLibraryMetadata {
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
    if (libDefinition?.permissions) {
      metadata.permissions = libDefinition.permissions;
    }

    return metadata;
  }

  async function runValidators() {
    const start = perf.startTimer();
    runtimeStats.validation = { total: 0, validators: {} };
    runCompilerValidators();
    runtimeStats.validation.validators.compiler = start.end();
    for (const validator of validateCbs) {
      const start = perf.startTimer();
      const diagnostics = await runValidator(validator);
      if (diagnostics && Array.isArray(diagnostics)) {
        program.reportDiagnostics(diagnostics);
      }
      runtimeStats.validation.validators[validator.metadata.name ?? "<unnamed>"] = start.end();
    }
    runtimeStats.validation.total = start.end();
  }

  async function runValidator(validator: Validator) {
    try {
      return await validator.callback(program);
    } catch (error: any) {
      if (options.designTimeBuild) {
        program.reportDiagnostic(
          createDiagnostic({
            code: "on-validate-fail",
            format: { error: error.stack },
            target: NoTarget,
          }),
        );
      } else {
        throw new ExternalError({ kind: "validator", metadata: validator.metadata, error });
      }
    }
  }

  /** Run the compiler built-in validators */
  function runCompilerValidators() {
    validateEncodedNamesConflicts(program);
    validatePagingOperations(program);
  }

  function validateRequiredImports() {
    for (const [requiredImport, emitterName] of requireImports) {
      if (!sourceResolution.loadedLibraries.has(requiredImport)) {
        program.reportDiagnostic(
          createDiagnostic({
            code: "missing-import",
            format: { requiredImport, emitterName },
            target: NoTarget,
          }),
        );
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
    locationContext: LocationContext,
  ): Promise<[ModuleResolutionResult | undefined, readonly Diagnostic[]]> {
    try {
      return [
        await resolveModule(createResolveModuleHost(host), specifier, {
          baseDir,
          conditions: ["import"],
        }),
        [],
      ];
    } catch (e: any) {
      if (e instanceof ResolveModuleError) {
        return [undefined, [moduleResolutionErrorToDiagnostic(e, specifier, NoTarget)]];
      } else {
        throw e;
      }
    }
  }

  // It's important that we use the compiler version that resolves locally
  // from the input TypeSpec source location. Otherwise, there will be undefined
  // runtime behavior when decorators and handlers expect a
  // different version of TypeSpec than the current one. Abort the compilation
  // with an error if the TypeSpec entry point resolves to a different local
  // compiler.
  async function checkForCompilerVersionMismatch(baseDir: string): Promise<boolean> {
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
        { baseDir },
      );
      compilerAssert(
        resolved.type === "module",
        `Expected to have resolved "@typespec/compiler" to a node module.`,
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
        }),
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
        suppressionTracker?.markUsed(suppressing.node);
        diagnostics.push({
          severity: "error",
          code: "suppress-error",
          message: "Errors cannot be suppressed.",
          target: suppressing.node,
        });

        return false;
      } else {
        suppressionTracker?.markUsed(suppressing.node);
        return true;
      }
    }
    return false;
  }

  function getNode(target: Node | Entity | Sym | TemplateInstanceTarget): Node | undefined {
    if (!("kind" in target) && !("valueKind" in target) && !("entityKind" in target)) {
      // TemplateInstanceTarget
      if (!("declarations" in target)) {
        return target.node;
      }
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
            }),
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
    mutate(node).parent = resolver.symbols.global.declarations[0];
    resolver.resolveTypeReference(node);
    return program.checker.resolveTypeReference(node);
  }

  function resolveTypeOrValueReference(
    reference: string,
  ): [Entity | undefined, readonly Diagnostic[]] {
    const [node, parseDiagnostics] = parseStandaloneTypeReference(reference);
    if (parseDiagnostics.length > 0) {
      return [undefined, parseDiagnostics];
    }
    const binder = createBinder(program);
    binder.bindNode(node);
    mutate(node).parent = resolver.symbols.global.declarations[0];
    resolver.resolveTypeReference(node);
    return program.checker.resolveTypeOrValueReference(node);
  }
}

/**
 * Resolve compiler options from input options.
 */
function resolveOptions(options: CompilerOptions): CompilerOptions {
  return { ...options };
}

async function emit(
  emitter: EmitterRef,
  program: Program,
): Promise<{ total: number; steps: Record<string, number> }> {
  const emitterName = emitter.metadata.name ?? "";
  const relativePathForEmittedFiles =
    transformPathForSink(program.host.logSink, emitter.emitterOutputDir) + "/";

  const errorCount = program.diagnostics.filter((x) => x.severity === "error").length;
  const warnCount = program.diagnostics.filter((x) => x.severity === "warning").length;
  const logger = createLogger({ sink: program.host.logSink });
  return await logger.trackAction(`Running ${emitterName}...`, "", async (task) => {
    const start = perf.startTimer();
    const emitterPerfReporter = await runEmitter(emitter, program);
    const duration = start.end();
    const message = `${emitterName} ${pc.green(`${Math.round(duration)}ms`)} ${pc.dim(relativePathForEmittedFiles)}`;
    const newErrorCount = program.diagnostics.filter((x) => x.severity === "error").length;
    const newWarnCount = program.diagnostics.filter((x) => x.severity === "warning").length;
    if (newErrorCount > errorCount) {
      task.fail(message);
    } else if (newWarnCount > warnCount) {
      task.warn(message);
    } else {
      task.succeed(message);
    }
    return { total: duration, steps: emitterPerfReporter.measures };
  });
}

/**
 * Run an emitter inside an OS-isolated sandbox process (see `runEmitterSandboxed`).
 *
 * Resolves the emitter's declared permissions against the user's `tspconfig.yaml`
 * grant; if anything was requested but not granted it reports a
 * `permission-not-granted` diagnostic and skips the emitter. Otherwise it spawns
 * a child constrained to the effective permissions, which recompiles and runs
 * only this emitter, and merges the child's emit-phase diagnostics and emitted
 * files back into `program`.
 */
async function emitSandboxed(
  emitter: EmitterRef,
  program: Program,
  host: CompilerHost,
  mainFile: string,
  options: CompilerOptions,
): Promise<{ total: number; steps: Record<string, number> } | undefined> {
  const emitterName = emitter.metadata.name ?? emitter.main;
  // The identifier the child uses to *resolve* the emitter. The resolved entry
  // path is always loadable regardless of how it was originally referenced.
  const emitId = emitter.main;
  const baseDir = options.configFile?.projectRoot ?? getDirectoryPath(mainFile);

  const grant = options.configFile?.permissions?.[emitterName];
  const resolution = resolvePermissions(emitter.metadata.permissions, grant, {
    baseDir,
    outputDir: emitter.emitterOutputDir,
  });

  if (resolution.missing.length > 0) {
    program.reportDiagnostic(
      createDiagnostic({
        code: "permission-not-granted",
        format: {
          emitterName,
          permissions: resolution.missing.map(formatPermission).join(", "),
          suggestion: formatGrantSuggestion(emitterName, resolution.missing),
        },
        target: NoTarget,
      }),
    );
    return undefined;
  }

  // All paths handed to the child must be realpath-resolved by the parent: the
  // permission model compares real paths and the child cannot traverse symlinks
  // (e.g. /var→/private/var) outside its granted scopes.
  const mainFileReal = resolveRealpath(mainFile);
  const emitIdReal = resolveRealpath(emitId);
  const outputDirReal = resolveRealpath(emitter.emitterOutputDir);
  const baseDirReal = resolveRealpath(baseDir);

  // Restrict the child to just this emitter and pin its output directory so it
  // emits to the same place the parent expects. Options are keyed by the
  // emitter name (matching how the child's loader looks them up).
  const childOptions: CompilerOptions = {
    ...options,
    emit: [emitIdReal],
    outputDir: options.outputDir ? resolveRealpath(options.outputDir) : undefined,
    options: {
      ...options.options,
      [emitterName]: {
        ...emitter.options,
        "emitter-output-dir": outputDirReal,
      },
    },
    configFile: options.configFile
      ? { ...options.configFile, projectRoot: baseDirReal }
      : undefined,
    sandbox: false,
  };

  const relativePathForEmittedFiles =
    transformPathForSink(program.host.logSink, emitter.emitterOutputDir) + "/";
  const errorCount = program.diagnostics.filter((x) => x.severity === "error").length;
  const warnCount = program.diagnostics.filter((x) => x.severity === "warning").length;
  const logger = createLogger({ sink: program.host.logSink });

  return await logger.trackAction(`Running ${emitterName}...`, "", async (task) => {
    const start = perf.startTimer();
    let result: SandboxEmitResult;
    try {
      result = await runEmitterSandboxed({
        mainFile: mainFileReal,
        options: childOptions,
        emitterNameOrPath: emitIdReal,
        permissions: resolution.effective,
        host,
        projectRoot: baseDirReal,
      });
    } catch (error: unknown) {
      throw new ExternalError({ kind: "emitter", metadata: emitter.metadata, error });
    }
    const duration = start.end();

    program.reportDiagnostics(result.diagnostics.map((d) => deserializeDiagnostic(d, program)));
    const emitted = getEmittedFilesForProgram(program);
    for (const file of result.emittedFiles) {
      emitted.push(file);
    }

    const message = `${emitterName} ${pc.green(`${Math.round(duration)}ms`)} ${pc.dim(relativePathForEmittedFiles)}`;
    const newErrorCount = program.diagnostics.filter((x) => x.severity === "error").length;
    const newWarnCount = program.diagnostics.filter((x) => x.severity === "warning").length;
    if (newErrorCount > errorCount) {
      task.fail(message);
    } else if (newWarnCount > warnCount) {
      task.warn(message);
    } else {
      task.succeed(message);
    }
    return { total: duration, steps: {} };
  });
}

/**
 * @param emitter Emitter ref to run
 */
async function runEmitter(emitter: EmitterRef, program: Program): Promise<PerfReporter> {
  const perfReporter = createPerfReporter();
  const context: EmitContext<any> = {
    program,
    emitterOutputDir: emitter.emitterOutputDir,
    options: emitter.options,
    perf: perfReporter,
  };
  try {
    await emitter.emitFunction(context);
    return perfReporter;
  } catch (error: unknown) {
    throw new ExternalError({ kind: "emitter", metadata: emitter.metadata, error });
  }
}

/**
 * Rebuild the program from `mainFile`/`options` and run a single emitter against
 * it, returning only the diagnostics produced by that emitter plus the files it
 * emitted, in a structured-clone-safe form.
 *
 * This is the entry point executed **inside** a sandboxed child process (see
 * `permissions/sandbox/emit-job.ts`): the child re-runs compilation locally to
 * obtain the live in-memory `Program` (which cannot cheaply cross the process
 * boundary) and then invokes only the requested `$onEmit`. Compilation
 * diagnostics are excluded — the parent already reported them — so only the
 * emit-phase delta is returned.
 *
 * @internal
 */
export async function runEmitterRecompiled(
  host: CompilerHost,
  mainFile: string,
  options: CompilerOptions,
  emitterNameOrPath: string,
): Promise<SandboxEmitResult> {
  // Build the program for just this emitter; never recurse into the sandbox.
  const { program } = await createProgram(host, mainFile, {
    ...options,
    emit: [emitterNameOrPath],
    sandbox: false,
  });

  // The parent already validated and loaded this emitter, so a load failure here
  // means the sandbox could not see something it needs (e.g. a missing read
  // scope). Surface it rather than silently emitting nothing.
  if (program.emitters.length === 0) {
    const errors = program.diagnostics.filter((d) => d.severity === "error");
    const detail = errors.map((d) => d.message).join("; ") || "no emitter was loaded";
    throw new Error(`Failed to load emitter '${emitterNameOrPath}' inside the sandbox: ${detail}`);
  }

  const beforeCount = program.diagnostics.length;
  for (const emitter of program.emitters) {
    if (options.dryRun && !emitter.library.definition?.capabilities?.dryRun) {
      continue;
    }
    await runEmitter(emitter, program);
  }

  return {
    diagnostics: program.diagnostics.slice(beforeCount).map(serializeDiagnostic),
    emittedFiles: [...getEmittedFilesForProgram(program)],
  };
}

function logEmittedFilesPath(program: Program) {
  getEmittedFilesForProgram(program).forEach((filePath) => {
    // eslint-disable-next-line no-console
    console.log(`    ${pc.dim(transformPathForSink(program.host.logSink, filePath))}`);
  });
}
function transformPathForSink(logSink: LogSink, path: string) {
  return logSink.getPath ? logSink.getPath(path) : path;
}
