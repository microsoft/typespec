import { log } from "console";
import { DiagnosticSeverity, Range, TextDocumentIdentifier } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  defaultConfig,
  findTypeSpecConfigPath,
  loadTypeSpecConfigFile,
} from "../config/config-loader.js";
import { resolveOptionsFromConfig } from "../config/config-to-options.js";
import { TypeSpecConfig } from "../config/types.js";
import {
  CompilerHost,
  CompilerOptions,
  Program,
  Diagnostic as TypeSpecDiagnostic,
  TypeSpecScriptNode,
  compilerAssert,
  formatDiagnostic,
  getDirectoryPath,
  joinPaths,
  parse,
} from "../core/index.js";
import { compile as compileProgram } from "../core/program.js";
import { doIO, loadFile, resolveTspMain } from "../core/util.js";
import { serverOptions } from "./constants.js";
import { FileService } from "./file-service.js";
import { FileSystemCache } from "./file-system-cache.js";
import { CompileResult, ServerHost } from "./types.js";

/**
 * Service managing compilation/caching of different TypeSpec projects
 */
export interface CompileService {
  /**
   * Compile the given document.
   *
   * Compilation can be aborted for various reasons:
   * - By the time the compilation start the document is already out of date.
   *
   * @param document The document to compile. This is not necessarily the entrypoint, compile will try to guess which entrypoint to compile to include this one.
   * @returns the compiled result or undefined if compilation was aborted.
   */
  compile(document: TextDocument | TextDocumentIdentifier): Promise<CompileResult | undefined>;

  /**
   * Load the AST for the given document.
   * @param document The document to load the AST for.
   */
  getScript(document: TextDocument | TextDocumentIdentifier): Promise<TypeSpecScriptNode>;
}

export interface CompileServiceOptions {
  fileSystemCache: FileSystemCache;
  fileService: FileService;
  serverHost: ServerHost;
  compilerHost: CompilerHost;
}
export function createCompileService({
  compilerHost,
  serverHost,
  fileService,
  fileSystemCache,
}: CompileServiceOptions): CompileService {
  const oldPrograms = new Map<string, Program>();

  return { compile, getScript };

  async function compile(
    document: TextDocument | TextDocumentIdentifier
  ): Promise<CompileResult | undefined> {
    const path = await fileService.getPath(document);
    const mainFile = await getMainFileForDocument(path);
    const config = await getConfig(mainFile);

    const [optionsFromConfig, _] = resolveOptionsFromConfig(config, { cwd: path });
    const options: CompilerOptions = {
      ...optionsFromConfig,
      ...serverOptions,
    };

    if (!fileService.upToDate(document)) {
      return undefined;
    }

    let program: Program;
    try {
      program = await compileProgram(compilerHost, mainFile, options, oldPrograms.get(mainFile));
      oldPrograms.set(mainFile, program);
      if (!fileService.upToDate(document)) {
        return undefined;
      }

      if (mainFile !== path && !program.sourceFiles.has(path)) {
        // If the file that changed wasn't imported by anything from the main
        // file, retry using the file itself as the main file.
        program = await compileProgram(compilerHost, path, options, oldPrograms.get(path));
        oldPrograms.set(path, program);
      }

      if (!fileService.upToDate(document)) {
        return undefined;
      }

      const doc = "version" in document ? document : serverHost.getOpenDocumentByURL(document.uri);
      compilerAssert(doc, "Failed to get document.");
      const resolvedPath = await fileService.getPath(doc);
      const script = program.sourceFiles.get(resolvedPath);
      compilerAssert(script, "Failed to get script.");

      return { program, document: doc, script };
    } catch (err: any) {
      if (serverHost.throwInternalErrors) {
        throw err;
      }
      serverHost.sendDiagnostics({
        uri: document.uri,
        diagnostics: [
          {
            severity: DiagnosticSeverity.Error,
            range: Range.create(0, 0, 0, 0),
            message:
              `Internal compiler error!\nFile issue at https://github.com/microsoft/typespec\n\n` +
              err.stack,
          },
        ],
      });

      return undefined;
    }
  }

  async function getConfig(mainFile: string): Promise<TypeSpecConfig> {
    const entrypointStat = await compilerHost.stat(mainFile);

    const lookupDir = entrypointStat.isDirectory() ? mainFile : getDirectoryPath(mainFile);
    const configPath = await findTypeSpecConfigPath(compilerHost, lookupDir, true);
    if (!configPath) {
      return { ...defaultConfig, projectRoot: getDirectoryPath(mainFile) };
    }

    const cached = await fileSystemCache.get(configPath);
    if (cached?.data) {
      return cached.data;
    }

    const config = await loadTypeSpecConfigFile(compilerHost, configPath);
    await fileSystemCache.setData(configPath, config);
    return config;
  }

  async function getScript(
    document: TextDocument | TextDocumentIdentifier
  ): Promise<TypeSpecScriptNode> {
    const file = await compilerHost.readFile(await fileService.getPath(document));
    const cached = compilerHost.parseCache?.get(file);
    if (cached === undefined) {
      const parsed = parse(file, { docs: true, comments: true });
      compilerHost.parseCache?.set(file, parsed);
      return parsed;
    } else {
      return cached;
    }
  }

  /**
   * Infer the appropriate entry point (a.k.a. "main file") for analyzing a
   * change to the file at the given path. This is necessary because different
   * results can be obtained from compiling the same file with different entry
   * points.
   *
   * Walk directory structure upwards looking for package.json with tspMain or
   * main.tsp file. Stop search when reaching a workspace root. If a root is
   * reached without finding an entry point, use the given path as its own
   * entry point.
   *
   * Untitled documents are always treated as their own entry points as they
   * do not exist in a directory that could pull them in via another entry
   * point.
   */
  async function getMainFileForDocument(path: string) {
    if (path.startsWith("untitled:")) {
      return path;
    }

    let dir = getDirectoryPath(path);
    const options = { allowFileNotFound: true };

    while (true) {
      let mainFile = "main.tsp";
      let pkg: any;
      const pkgPath = joinPaths(dir, "package.json");
      const cached = await fileSystemCache.get(pkgPath);

      if (cached?.data) {
        pkg = cached.data;
      } else {
        [pkg] = await loadFile(
          compilerHost,
          pkgPath,
          JSON.parse,
          logMainFileSearchDiagnostic,
          options
        );
        await fileSystemCache.setData(pkgPath, pkg ?? {});
      }

      const tspMain = resolveTspMain(pkg);
      if (typeof tspMain === "string") {
        mainFile = tspMain;
      }

      const candidate = joinPaths(dir, mainFile);
      const stat = await doIO(
        () => compilerHost.stat(candidate),
        candidate,
        logMainFileSearchDiagnostic,
        options
      );

      if (stat?.isFile()) {
        return candidate;
      }

      const parentDir = getDirectoryPath(dir);
      if (parentDir === dir) {
        break;
      }
      dir = parentDir;
    }

    return path;

    function logMainFileSearchDiagnostic(diagnostic: TypeSpecDiagnostic) {
      log(
        `Unexpected diagnostic while looking for main file of ${path}`,
        formatDiagnostic(diagnostic)
      );
    }
  }
}
