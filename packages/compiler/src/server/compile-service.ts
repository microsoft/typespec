import { DiagnosticSeverity, Range, TextDocumentIdentifier } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  defaultConfig,
  findTypeSpecConfigPath,
  loadTypeSpecConfigFile,
  TypeSpecConfigFilename,
} from "../config/config-loader.js";
import { resolveOptionsFromConfig } from "../config/config-to-options.js";
import { TypeSpecConfig } from "../config/types.js";
import { builtInLinterRule_UnusedTemplateParameter } from "../core/linter-rules/unused-template-parameter.rule.js";
import { builtInLinterRule_UnusedUsing } from "../core/linter-rules/unused-using.rule.js";
import { builtInLinterLibraryName } from "../core/linter.js";
import { CompilerOptions } from "../core/options.js";
import { parse } from "../core/parser.js";
import { getBaseFileName, getDirectoryPath } from "../core/path-utils.js";
import type { CompilerHost, TypeSpecScriptNode } from "../core/types.js";
import { deepClone, distinctArray } from "../utils/misc.js";
import { parseYaml } from "../yaml/parser.js";
import { ClientConfigProvider } from "./client-config-provider.js";
import { serverOptions } from "./constants.js";
import { getDiagnosticRangeInTspConfig } from "./diagnostics.js";
import { resolveEntrypointFile } from "./entrypoint-resolver.js";
import { FileService } from "./file-service.js";
import { FileSystemCache } from "./file-system-cache.js";
import {
  CompileTracker,
  ServerCompileManager,
  ServerCompileOptions,
} from "./server-compile-manager.js";
import { CompileResult, ServerHost, ServerLog } from "./types.js";
import { UpdateManager, UpdateType } from "./update-manager.js";

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
  compile(
    document: TextDocument | TextDocumentIdentifier,
    additionalOptions: CompilerOptions | undefined,
    serverCompileOptions: ServerCompileOptions,
  ): Promise<CompileResult | undefined>;

  /**
   * Load the AST for the given document.
   * @param document The document to load the AST for.
   */
  getScript(document: TextDocument | TextDocumentIdentifier): Promise<TypeSpecScriptNode>;

  /**
   * Notify the service that the given document has changed and a compilation should be requested.
   * It will recompile after a debounce timer so we don't recompile on every keystroke.
   * @param document Document that changed.
   */
  notifyChange(document: TextDocument | TextDocumentIdentifier, updateType: UpdateType): void;

  on(event: "compileEnd", listener: (result: CompileResult) => void): void;

  getMainFileForDocument(path: string): Promise<string | undefined>;
}

export interface CompileServiceOptions {
  readonly fileSystemCache: FileSystemCache;
  readonly fileService: FileService;
  readonly serverHost: ServerHost;
  readonly compilerHost: CompilerHost;
  readonly updateManager: UpdateManager;
  readonly log: (log: ServerLog) => void;
  readonly clientConfigsProvider?: ClientConfigProvider;
}

export function createCompileService({
  compilerHost,
  serverHost,
  fileService,
  fileSystemCache,
  updateManager,
  log,
  clientConfigsProvider,
}: CompileServiceOptions): CompileService {
  const eventListeners = new Map<string, (...args: unknown[]) => void | Promise<void>>();
  const compileManager = new ServerCompileManager(updateManager, compilerHost, log);
  let configFilePath: string | undefined;

  return { compile, getScript, on, notifyChange, getMainFileForDocument };

  function on(event: string, listener: (...args: any[]) => void) {
    eventListeners.set(event, listener);
  }

  function notify(event: string, ...args: unknown[]) {
    const listener = eventListeners.get(event);
    if (listener) {
      void listener(...args);
    }
  }

  function notifyChange(document: TextDocument | TextDocumentIdentifier, updateType: UpdateType) {
    void updateManager.scheduleUpdate(document, updateType);
  }

  /**
   * Compile the given document.
   * First, the main.tsp file will be obtained for compilation.
   * If the current document is not the main.tsp file or not included in the compilation starting from the main file found,
   * the current document will be recompiled and returned as part of the result.
   * Otherwise, the compilation of main.tsp will be returned as part of the result.
   * @param document The document to compile. tsp file that is open or not opened in workspace.
   * @returns see {@link CompileResult} for more details.
   */
  async function compile(
    document: TextDocument | TextDocumentIdentifier,
    additionalOptions: CompilerOptions | undefined,
    serverCompileOptions: ServerCompileOptions,
  ): Promise<CompileResult | undefined> {
    const path = await fileService.getPath(document);
    const pathBaseName = getBaseFileName(path);
    if (!path.endsWith(".tsp") && pathBaseName !== TypeSpecConfigFilename) {
      return undefined;
    }
    const mainFile = await getMainFileForDocument(path);
    if (mainFile === undefined) {
      log({ level: "debug", message: `failed to resolve main file for ${path}` });
      return undefined;
    }
    if (!mainFile.endsWith(".tsp")) {
      return undefined;
    }
    const config = await getConfig(mainFile);
    configFilePath = config.filename;
    log({ level: "debug", message: `config resolved`, detail: config });
    const [optionsFromConfig, _] = resolveOptionsFromConfig(config, {
      cwd: getDirectoryPath(path),
    });
    // we need to keep the optionsFromConfig unchanged which will be returned in CompileResult
    const clone = deepClone(optionsFromConfig);
    const options: CompilerOptions = {
      ...clone,
      ...serverOptions,
      ...(additionalOptions ?? {}),
    };

    // If emit is set in additionalOptions, use this setting first
    // otherwise, obtain the `typespec.lsp.emit` configuration from clientConfigsProvider
    if (additionalOptions?.emit === undefined) {
      const configEmits = clientConfigsProvider?.config?.lsp?.emit;
      const CONFIG_DEFAULTS = "<config:defaults>";
      if (configEmits) {
        if (configEmits.find((e) => e === CONFIG_DEFAULTS)) {
          // keep the emits in tspconfig only when user configs "<config:defaults>", and append other emits from vscode settings if there is any
          options.emit = distinctArray(
            [...(options.emit ?? []), ...configEmits.filter((e) => e !== CONFIG_DEFAULTS)],
            (s) => s,
          );
        } else {
          // use the configured emits if no "<config:defaults>" is found
          options.emit = configEmits;
        }
      } else {
        // by default, exclude emits from compile which are not useful in most case but may cause perf issue
        // User can set ['<config:defaults>'] to opt-in
        options.emit = [];
      }
    }

    // add linter rule for unused using if user didn't configure it explicitly
    const unusedUsingRule = `${builtInLinterLibraryName}/${builtInLinterRule_UnusedUsing}`;
    if (
      options.linterRuleSet?.enable?.[unusedUsingRule] === undefined &&
      options.linterRuleSet?.disable?.[unusedUsingRule] === undefined
    ) {
      options.linterRuleSet ??= {};
      options.linterRuleSet.enable ??= {};
      options.linterRuleSet.enable[unusedUsingRule] = true;
    }

    // add linter rule for unused template parameter if user didn't configure it explicitly
    const unusedTemplateParameterRule = `${builtInLinterLibraryName}/${builtInLinterRule_UnusedTemplateParameter}`;
    if (
      options.linterRuleSet?.enable?.[unusedTemplateParameterRule] === undefined &&
      options.linterRuleSet?.disable?.[unusedTemplateParameterRule] === undefined
    ) {
      options.linterRuleSet ??= {};
      options.linterRuleSet.enable ??= {};
      options.linterRuleSet.enable[unusedTemplateParameterRule] = true;
    }

    const isCancelledOrOutOfDate = () => {
      return serverCompileOptions.isCancelled?.() || !fileService.upToDate(document);
    };

    if (isCancelledOrOutOfDate()) {
      return undefined;
    }

    let tracker: CompileTracker;
    try {
      tracker = await compileManager.compile(mainFile, options, serverCompileOptions);
      let program = await tracker.getCompileResult();
      if (isCancelledOrOutOfDate()) {
        return undefined;
      }

      if (
        mainFile !== path &&
        !program.sourceFiles.has(path) &&
        pathBaseName !== TypeSpecConfigFilename
      ) {
        // If the file that changed wasn't imported by anything from the main
        // file, retry using the file itself as the main file.
        log({
          level: "debug",
          message: `target file was not included in compiling, try to compile ${path} as main file directly`,
        });
        tracker = await compileManager.compile(path, options, serverCompileOptions);
        program = await tracker.getCompileResult();
      }
      if (isCancelledOrOutOfDate()) {
        return undefined;
      }

      const doc = "version" in document ? document : serverHost.getOpenDocumentByURL(document.uri);
      const script = program.sourceFiles.get(path);

      const result: CompileResult = { program, document: doc, script, optionsFromConfig, tracker };
      notify("compileEnd", result);
      return result;
    } catch (err: any) {
      if (serverHost.throwInternalErrors) {
        throw err;
      }

      let uri = document.uri;
      let range: Range | undefined;
      let externalErrorMessage = "External compiler error!";
      if (err.name === "ExternalError" && err.info.kind === "emitter" && configFilePath) {
        const emitterName = err.info.metadata.name;
        if (config.file) {
          const [yamlScript] = parseYaml(config.file.file.text);
          range = getDiagnosticRangeInTspConfig(yamlScript, emitterName);
        }

        if (range === undefined) {
          const clientConfigEmit = clientConfigsProvider?.config?.lsp?.emit;
          if (clientConfigEmit && clientConfigEmit.includes(emitterName)) {
            externalErrorMessage += ` [From emitter '${emitterName}' enabled in IDE settings]`;
          } else {
            log({
              level: "debug",
              message: `Unexpected situation, can't find emitter '${emitterName}' in either config file '${configFilePath}' or IDE settings`,
            });
          }
        } else {
          uri = fileService.getURL(configFilePath);
        }
      }

      externalErrorMessage += "\n";
      serverHost.sendDiagnostics({
        uri,
        diagnostics: [
          {
            severity: DiagnosticSeverity.Error,
            range: range ?? Range.create(0, 0, 0, 0),
            message:
              (err.name === "ExternalError"
                ? externalErrorMessage
                : `Internal compiler error!\nFile issue at https://github.com/microsoft/typespec\n\n`) +
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
      log({
        level: "debug",
        message: `can't find path with config file, try to use default config`,
      });
      return { ...defaultConfig, projectRoot: getDirectoryPath(mainFile) };
    }

    const cached = await fileSystemCache.get(configPath);
    const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));
    if (cached?.data) {
      return deepCopy(cached.data);
    }

    const config = await loadTypeSpecConfigFile(compilerHost, configPath);
    return deepCopy(config);
  }

  async function getScript(
    document: TextDocument | TextDocumentIdentifier,
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
   * Priority is given to processing user-defined files as the entry point,
   * and it has the highest priority.
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
      log({ level: "debug", message: `untitled document treated as its own main file: ${path}` });
      return path;
    }

    const entrypoints = clientConfigsProvider?.config?.entrypoint;
    return resolveEntrypointFile(compilerHost, entrypoints, path, fileSystemCache, log);
  }
}
