import {
  CancellationToken,
  DiagnosticSeverity,
  PublishDiagnosticsParams,
  Range,
  TextDocumentIdentifier,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  defaultConfig,
  findTypeSpecConfigPath,
  loadTypeSpecConfigFile,
} from "../config/config-loader.js";
import { resolveOptionsFromConfig } from "../config/config-to-options.js";
import { TypeSpecConfig } from "../config/types.js";
import { compilerAssert } from "../core/diagnostics.js";
import { builtInLinterRule_UnusedTemplateParameter } from "../core/linter-rules/unused-template-parameter.rule.js";
import { builtInLinterRule_UnusedUsing } from "../core/linter-rules/unused-using.rule.js";
import { builtInLinterLibraryName } from "../core/linter.js";
import { formatDiagnostic } from "../core/logger/console-sink.js";
import { CompilerOptions } from "../core/options.js";
import { parse } from "../core/parser.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import type {
  CompilerHost,
  Diagnostic as TypeSpecDiagnostic,
  TypeSpecScriptNode,
} from "../core/types.js";
import { doIO, loadFile } from "../utils/io.js";
import { distinctArray, resolveTspMain } from "../utils/misc.js";
import { getLocationInYamlScript } from "../yaml/diagnostics.js";
import { parseYaml } from "../yaml/parser.js";
import { ClientConfigProvider } from "./client-config-provider.js";
import { CompileMode, CompileTracker, CompileTrackerManager } from "./compile-tracker.js";
import { serverOptions } from "./constants.js";
import { FileService } from "./file-service.js";
import { FileSystemCache } from "./file-system-cache.js";
import { CompileResult, ServerHost, ServerLog } from "./types.js";
import { UpdateManger } from "./update-manager.js";

interface ServerCompileOptions {
  bypassCache?: boolean;
  trackAction?: boolean;
  /** by default: core mode */
  mode: CompileMode;
  onUnexpectedException?: (errAsDiag: PublishDiagnosticsParams) => void;
}
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
  compile_server(
    document: TextDocument | TextDocumentIdentifier,
    additionalOptions: CompilerOptions | undefined,
    serverCompileOptions: ServerCompileOptions,
    cancellationToken?: CancellationToken,
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
  notifyChange(document: TextDocument | TextDocumentIdentifier): void;

  on(event: "compileEnd", listener: (result: CompileResult) => void): void;

  getMainFileForDocument(path: string): Promise<string>;
}

export interface CompileServiceOptions {
  readonly fileSystemCache: FileSystemCache;
  readonly fileService: FileService;
  readonly serverHost: ServerHost;
  readonly compilerHost: CompilerHost;
  readonly updateManager: UpdateManger;
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
  const compileManager = new CompileTrackerManager(updateManager, compilerHost);
  let configFilePath: string | undefined;

  return { compile_server: compile, getScript, on, notifyChange, getMainFileForDocument };

  function on(event: string, listener: (...args: any[]) => void) {
    eventListeners.set(event, listener);
  }

  async function notify(event: string, ...args: unknown[]) {
    const listener = eventListeners.get(event);
    if (listener) {
      await listener(...args);
    }
  }

  function notifyChange(document: TextDocument | TextDocumentIdentifier) {
    updateManager.scheduleUpdate(document);
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
    additionalOptions?: CompilerOptions,
    serverCompileOptions?: ServerCompileOptions,
    cancellationToken?: CancellationToken,
  ): Promise<CompileResult | undefined> {
    const path = await fileService.getPath(document);
    const mainFile = await getMainFileForDocument(path);
    const config = await getConfig(mainFile);
    configFilePath = config.filename;
    const [optionsFromConfig, _] = resolveOptionsFromConfig(config, {
      cwd: getDirectoryPath(path),
    });
    const options: CompilerOptions = {
      ...optionsFromConfig,
      ...serverOptions,
      ...(additionalOptions ?? {}),
    };

    // If emit is set in additionalOptions, use this setting first
    // otherwise, obtain the `typespec.lsp.emit` configuration from clientConfigsProvider
    if (additionalOptions?.emit === undefined) {
      const configEmits = clientConfigsProvider?.config?.lsp?.emit;
      if (configEmits) {
        if (configEmits.find((e) => e === "*")) {
          // keep the emits in tspconfig only when user configs "*", and append other emits from vscode settings if there is any
          options.emit = distinctArray(
            [...(options.emit ?? []), ...configEmits.filter((e) => e !== "*")],
            (s) => s,
          );
        } else {
          // use the configured emits if no "*" is found
          options.emit = configEmits;
        }
      } else {
        // by default, exclude emits from compile which are not useful in most case
        // but may cause perf issues in many case
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

    if (!fileService.upToDate(document)) {
      return undefined;
    }

    if (cancellationToken?.isCancellationRequested) {
      return undefined;
    }

    let tracker: CompileTracker;
    try {
      const skipOldProgramFromCache = serverCompileOptions?.bypassCache === true;
      tracker = await compileManager.compile(mainFile, options, {
        skipCache: false,
        skipOldProgramFromCache,
        mode: serverCompileOptions?.mode ?? "full",
      });
      let program = await tracker.getCompileResult();
      if (!fileService.upToDate(document)) {
        return undefined;
      }
      if (cancellationToken?.isCancellationRequested) {
        return undefined;
      }

      if (mainFile !== path && !program.sourceFiles.has(path)) {
        // If the file that changed wasn't imported by anything from the main
        // file, retry using the file itself as the main file.
        log({
          level: "debug",
          message: `target file was not included in compiling, try to compile ${path} as main file directly`,
        });
        tracker = await compileManager.compile(path, options, {
          skipCache: false,
          skipOldProgramFromCache,
          mode: serverCompileOptions?.mode ?? "full",
        });
        program = await tracker.getCompileResult();
      }

      if (!fileService.upToDate(document)) {
        return undefined;
      }

      const doc = "version" in document ? document : serverHost.getOpenDocumentByURL(document.uri);
      const script = program.sourceFiles.get(path);
      compilerAssert(script, "Failed to get script.");

      const result: CompileResult = { program, document: doc, script, optionsFromConfig, tracker };
      await notify("compileEnd", result);
      return result;
    } catch (err: any) {
      if (serverHost.throwInternalErrors) {
        throw err;
      }

      let uri = document.uri;
      let range = Range.create(0, 0, 0, 0);
      if (err.name === "ExternalError" && err.info.kind === "emitter" && configFilePath) {
        const emitterName = err.info.metadata.name;
        const [yamlScript] = parseYaml(await serverHost.compilerHost.readFile(configFilePath));
        const target = getLocationInYamlScript(yamlScript, ["emit", emitterName], "key");
        if (target.pos === 0) {
          log({
            level: "debug",
            message: `Unexpected situation, can't find emitter '${emitterName}' in config file '${configFilePath}'`,
          });
        }
        uri = fileService.getURL(configFilePath);
        const lineAndChar = target.file.getLineAndCharacterOfPosition(target.pos);
        range = Range.create(
          lineAndChar.line,
          lineAndChar.character,
          lineAndChar.line,
          lineAndChar.character + emitterName.length,
        );
      }

      const param = {
        uri,
        diagnostics: [
          {
            severity: DiagnosticSeverity.Error,
            range,
            message:
              (err.name === "ExternalError"
                ? "External compiler error!\n"
                : `Internal compiler error!\nFile issue at https://github.com/microsoft/typespec\n\n`) +
              err.stack,
          },
        ],
      };
      if (serverCompileOptions?.onUnexpectedException) {
        serverCompileOptions.onUnexpectedException(param);
        return undefined;
      }

      // serverHost.sendDiagnostics({
      //   uri,
      //   diagnostics: [
      //     {
      //       severity: DiagnosticSeverity.Error,
      //       range,
      //       message:
      //         (err.name === "ExternalError"
      //           ? "External compiler error!\n"
      //           : `Internal compiler error!\nFile issue at https://github.com/microsoft/typespec\n\n`) +
      //         err.stack,
      //     },
      //   ],
      // });

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
          options,
        );
        await fileSystemCache.setData(pkgPath, pkg ?? {});
      }

      const tspMain = resolveTspMain(pkg);
      if (typeof tspMain === "string") {
        log({
          level: "debug",
          message: `tspMain resolved from package.json (${pkgPath}) as ${tspMain}`,
        });
        mainFile = tspMain;
      }

      const candidate = joinPaths(dir, mainFile);
      const stat = await doIO(
        () => compilerHost.stat(candidate),
        candidate,
        logMainFileSearchDiagnostic,
        options,
      );

      if (stat?.isFile()) {
        log({ level: "debug", message: `main file found as ${candidate}` });
        return candidate;
      }

      const parentDir = getDirectoryPath(dir);
      if (parentDir === dir) {
        break;
      }
      log({
        level: "debug",
        message: `main file not found in ${dir}, search in parent directory ${parentDir}`,
      });
      dir = parentDir;
    }

    log({ level: "debug", message: `reached directory root, using ${path} as main file` });
    return path;

    function logMainFileSearchDiagnostic(diagnostic: TypeSpecDiagnostic) {
      log({
        level: `error`,
        message: `Unexpected diagnostic while looking for main file of ${path}`,
        detail: formatDiagnostic(diagnostic),
      });
    }
  }
}
