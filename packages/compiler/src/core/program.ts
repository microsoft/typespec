import pc from "picocolors";
import { EmitterOptions } from "../config/types.js";
import { setCurrentProgram } from "../experimental/typekit/index.js";
import { validateEncodedNamesConflicts } from "../lib/encoded-names.js";
import { validatePagingOperations } from "../lib/paging.js";
import { MANIFEST } from "../manifest.js";
import {
  ModuleResolutionResult,
  ResolveModuleError,
  ResolveModuleHost,
  ResolvedModule,
  resolveModule,
} from "../module-resolver/module-resolver.js";
import { PackageJson } from "../types/package-json.js";
import { findProjectRoot } from "../utils/io.js";
import { deepEquals, isDefined, mapEquals, mutate } from "../utils/misc.js";
import { createBinder } from "./binder.js";
import { Checker, createChecker } from "./checker.js";
import { createSuppressCodeFix } from "./compiler-code-fixes/suppress.codefix.js";
import { compilerAssert } from "./diagnostics.js";
import { flushEmittedFilesPaths } from "./emitter-utils.js";
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
import { createResolver } from "./name-resolver.js";
import { CompilerOptions } from "./options.js";
import { parse, parseStandaloneTypeReference } from "./parser.js";
import { getDirectoryPath, joinPaths, resolvePath } from "./path-utils.js";
import {
  SourceLoader,
  SourceResolution,
  createSourceLoader,
  loadJsFile,
  moduleResolutionErrorToDiagnostic,
} from "./source-loader.js";
import { createStateAccessors } from "./state-accessors.js";
import {
  CompilerHost,
  Diagnostic,
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
  LogSink,
  ModuleLibraryMetadata,
  Namespace,
  NoTarget,
  Node,
  SourceFile,
  Sym,
  SymbolFlags,
  SymbolTable,
  SyntaxKind,
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
  literalTypes: Map<string | number | boolean, LiteralType>;
  host: CompilerHost;
  tracer: Tracer;
  trace(area: string, message: string): void;
  /**
   * **DANGER** Using the checker is reserved for advanced usage and should be used with caution.
   * API are not subject to the same stability guarantees see See https://typespec.io/docs/handbook/breaking-change-policy/
   */
  checker: Checker;
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
  /** @internal */
  stateMaps: Map<symbol, Map<Type, unknown>>;
  hasError(): boolean;
  reportDiagnostic(diagnostic: Diagnostic): void;
  reportDiagnostics(diagnostics: readonly Diagnostic[]): void;

  /** @internal */
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
  readonly library: LibraryInstance;
}

interface Validator {
  metadata: LibraryMetadata;
  callback: (program: Program) => void | Promise<void>;
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

  // Emitter stage
  for (const emitter of program.emitters) {
    // If in dry mode run and an emitter doesn't support it we have to skip it.
    if (program.compilerOptions.dryRun && !emitter.library.definition?.capabilities?.dryRun) {
      continue;
    }
    await emit(emitter, program);

    if (options.listFiles) {
      logEmittedFilesPath(host.logSink);
    }
  }
  return program;
}

async function createProgram(
  host: CompilerHost,
  mainFile: string,
  options: CompilerOptions = {},
  oldProgram?: Program,
): Promise<{ program: Program; shouldAbort: boolean }> {
  const validateCbs: Validator[] = [];
  const stateMaps = new Map<symbol, Map<Type, unknown>>();
  const stateSets = new Map<symbol, Set<Type>>();
  const diagnostics: Diagnostic[] = [];
  const duplicateSymbols = new Set<Sym>();
  const emitters: EmitterRef[] = [];
  const requireImports = new Map<string, string>();
  let sourceResolution: SourceResolution;
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

  await loadSources(resolvedMain);

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
  setCurrentProgram(program);

  const resolver = createResolver(program);
  resolver.resolveProgram();

  const linter = createLinter(program, (name) => loadLibrary(basedir, name));
  linter.registerLinterLibrary(builtInLinterLibraryName, createBuiltInLinterLibrary(resolver));
  if (options.linterRuleSet) {
    program.reportDiagnostics(await linter.extendRuleSet(options.linterRuleSet));
  }

  program.checker = createChecker(program, resolver);
  program.checker.checkProgram();

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
  program.reportDiagnostics(linter.lint());

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
        await resolveModule(getResolveModuleHost(), specifier, { baseDir, conditions: ["import"] }),
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
    directives: readonly DirectiveExpressionNode[],
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
}

/**
 * Resolve compiler options from input options.
 */
function resolveOptions(options: CompilerOptions): CompilerOptions {
  return { ...options };
}

async function emit(emitter: EmitterRef, program: Program) {
  const emitterName = emitter.metadata.name ?? "";
  const relativePathForEmittedFiles =
    transformPathForSink(program.host.logSink, emitter.emitterOutputDir) + "/";

  const errorCount = program.diagnostics.filter((x) => x.severity === "error").length;
  const warnCount = program.diagnostics.filter((x) => x.severity === "warning").length;
  const logger = createLogger({ sink: program.host.logSink });
  await logger.trackAction(
    `Running ${emitterName}...`,
    `${emitterName}    ${pc.dim(relativePathForEmittedFiles)}`,
    async (task) => {
      await runEmitter(emitter, program);

      const newErrorCount = program.diagnostics.filter((x) => x.severity === "error").length;
      const newWarnCount = program.diagnostics.filter((x) => x.severity === "warning").length;
      if (newErrorCount > errorCount) {
        task.fail();
      } else if (newWarnCount > warnCount) {
        task.warn();
      }
    },
  );
}

/**
 * @param emitter Emitter ref to run
 */
async function runEmitter(emitter: EmitterRef, program: Program) {
  const context: EmitContext<any> = {
    program,
    emitterOutputDir: emitter.emitterOutputDir,
    options: emitter.options,
  };
  try {
    await emitter.emitFunction(context);
  } catch (error: unknown) {
    throw new ExternalError({ kind: "emitter", metadata: emitter.metadata, error });
  }
}

function logEmittedFilesPath(logSink: LogSink) {
  flushEmittedFilesPaths().forEach((filePath) => {
    // eslint-disable-next-line no-console
    console.log(`    ${pc.dim(transformPathForSink(logSink, filePath))}`);
  });
}
function transformPathForSink(logSink: LogSink, path: string) {
  return logSink.getPath ? logSink.getPath(path) : path;
}
