import { trace } from "console";
import { deepEquals, doIO, resolveTspMain } from "../utils/misc.js";
import { compilerAssert } from "./diagnostics.js";
import { resolveTypeSpecEntrypointForDir } from "./entrypoint-resolution.js";
import { createDiagnostic } from "./messages.js";
import {
  ModuleResolutionResult,
  NodePackage,
  ResolvedModule,
  resolveModule,
  ResolveModuleHost,
} from "./module-resolver.js";
import { isImportStatement, parse } from "./parser.js";
import { getDirectoryPath } from "./path-utils.js";
import { createSourceFile } from "./source-file.js";
import {
  DiagnosticTarget,
  ModuleLibraryMetadata,
  NodeFlags,
  NoTarget,
  ParseOptions,
  SourceFile,
  SyntaxKind,
  type CompilerHost,
  type Diagnostic,
  type JsSourceFileNode,
  type LocationContext,
  type TypeSpecScriptNode,
} from "./types.js";

export interface SourceResolution {
  /** TypeSpec source files */
  readonly sourceFiles: Map<string, TypeSpecScriptNode>;

  /** Javascript source files(Entrypoint only) */
  readonly jsSourceFiles: Map<string, JsSourceFileNode>;

  readonly diagnostics: readonly Diagnostic[];
}

interface TypeSpecLibraryReference {
  path: string;
  manifest: NodePackage;
}

export interface LoadSourceOptions {
  readonly additionalImports?: string[];
  readonly parseOptions?: ParseOptions;
  getCachedScript?: (file: SourceFile) => TypeSpecScriptNode | undefined;
}

export async function loadSources(
  host: CompilerHost,
  entrypoint: string,
  options?: LoadSourceOptions
): Promise<SourceResolution> {
  const diagnostics: Diagnostic[] = [];

  await loadMain(entrypoint);

  for (const additionalImport of options?.additionalImports ?? []) {
    await loadImport(additionalImport, NoTarget, getDirectoryPath(entrypoint), {
      type: "project",
    });
  }

  const seenSourceFiles = new Set<string>();
  const sourceFileLocationContexts = new WeakMap<SourceFile, LocationContext>();
  const sourceFiles = new Map<string, TypeSpecScriptNode>();
  const jsSourceFiles = new Map<string, JsSourceFileNode>();
  const loadedLibraries = new Map<string, TypeSpecLibraryReference>();

  return {
    sourceFiles,
    jsSourceFiles,
    diagnostics,
  };

  async function loadMain(mainPath: string) {
    const sourceFileKind = host.getSourceFileKind(mainPath);

    const locationContext: LocationContext = { type: "project" };
    switch (sourceFileKind) {
      case "js":
        return await importJsFile(mainPath, locationContext, NoTarget);
      case "typespec":
        return await loadTypeSpecFile(mainPath, locationContext, NoTarget);
      default:
        diagnostics.push(createDiagnostic({ code: "invalid-main", target: NoTarget }));
    }
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

    const file = await doIO(host.readFile, path, (x) => diagnostics.push(x), {
      diagnosticTarget,
    });

    if (file) {
      sourceFileLocationContexts.set(file, locationContext);
      await loadTypeSpecScript(file);
    }
  }

  async function loadTypeSpecScript(file: SourceFile): Promise<TypeSpecScriptNode> {
    // This is not a diagnostic because the compiler should never reuse the same path.
    // It's the caller's responsibility to use unique paths.
    if (sourceFiles.has(file.path)) {
      throw new RangeError("Duplicate script path: " + file.path);
    }

    const script = parseOrReuse(file);
    for (const diagnostic of script.parseDiagnostics) {
      diagnostics.push(diagnostic);
    }

    sourceFiles.set(file.path, script);
    await loadScriptImports(script);
    return script;
  }

  function parseOrReuse(file: SourceFile): TypeSpecScriptNode {
    if (options?.getCachedScript) {
      const old = options.getCachedScript(file);
      if (old?.file === file && deepEquals(old.parseOptions, options.parseOptions)) {
        return old;
      }
    }
    const script = parse(file, options?.parseOptions);
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
        diagnostics.push(createDiagnostic({ code: "invalid-import", target }));
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
        diagnostics.push(
          createDiagnostic({ code: "import-not-found", format: { path: specifier }, target })
        );
        return undefined;
      } else if (e.code === "INVALID_MAIN") {
        diagnostics.push(
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

  async function loadDirectory(
    dir: string,
    locationContext: LocationContext,
    diagnosticTarget: DiagnosticTarget | typeof NoTarget
  ): Promise<string> {
    const mainFile = await resolveTypeSpecEntrypointForDir(host, dir, (x) => diagnostics.push(x));
    await loadTypeSpecFile(mainFile, locationContext, diagnosticTarget);
    return mainFile;
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
      jsSourceFiles.set(path, file);
    }
  }

  async function loadJsFile(
    path: string,
    locationContext: LocationContext,
    diagnosticTarget: DiagnosticTarget | typeof NoTarget
  ): Promise<JsSourceFileNode | undefined> {
    const sourceFile = jsSourceFiles.get(path);
    if (sourceFile !== undefined) {
      return sourceFile;
    }

    const file = createSourceFile("", path);
    sourceFileLocationContexts.set(file, locationContext);
    const exports = await doIO(host.getJsImport, path, (x) => diagnostics.push(x), {
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
