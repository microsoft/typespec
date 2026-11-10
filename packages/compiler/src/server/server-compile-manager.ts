import { formatLog } from "../core/logger/index.js";
import type { CompilerHost, CompilerOptions, ProcessedLog, Program, ServerLog } from "../index.js";
import { compile as compileProgram, normalizePath } from "../index.js";
import { debugLoggers } from "./debug.js";
import { trackActionFunc } from "./server-track-action-task.js";
import type { UpdateManager } from "./update-manager.js";

/**
 * Compilation work requested by a server operation.
 * In core mode, emitters are disabled and the linter rule set is cleared.
 * Full mode preserves the supplied compiler options. A completed full compilation
 * can also satisfy a core-mode request.
 */
export type ServerCompileMode = "core" | "full";

/** Cache and freshness controls for a language-server compilation request. */
export interface ServerCompileOptions {
  /** Start a new compilation instead of returning a cached tracker; does not prevent reuse of an old program. */
  skipCache?: boolean;
  /** Do not seed a new compilation with a previously completed program; does not prevent returning a cached tracker. */
  skipOldProgramFromCache?: boolean;
  /** Required choice of analysis-only or full compilation; there is no implicit default mode. */
  mode: ServerCompileMode;
  /** Check whether to discard the request before or after asynchronous compilation work; does not interrupt the compiler. */
  isCancelled?: () => boolean;
}

/**
 * This class purely manages compilations triggered and the caches used underneath. It doesn't have or care about any extra knowledge beyond compile itself.
 * Instead compiler service would have more knowledge about the lsp scenarios to provide higher level service. It will be responsible to make sure compilation request
 * is built properly (i.e. figure out the correct entrypoint file, double check whether compilation result covers given document, and so on) and then trigger the actual
 * compilation with proper options through this class.
 */
export class ServerCompileManager {
  // We may want a ttl for this
  private trackerCache = new CompileCache((msg) => this.logDebug(msg));
  private compileId = 0;
  private logDebug: (msg: string) => void;

  constructor(
    private updateManager: UpdateManager,
    private compilerHost: CompilerHost,
    private log: (log: ServerLog) => void,
  ) {
    const debug = debugLoggers.serverCompile;
    this.logDebug = debug.enabled ? (msg) => this.log({ level: "debug", message: msg }) : () => {};
  }

  async compile(
    mainFile: string,
    compileOptions: CompilerOptions = {},
    serverCompileOptions: ServerCompileOptions,
  ): Promise<CompileTracker> {
    let cache;
    const curId = this.compileId++;
    const err = new Error();
    const lines = err.stack?.split("\n") ?? [];
    // log where the compiler is triggered, skip the first 2 frame and only log the next 2 if exists
    const stackLines = lines.slice(3, 5).join("\n");
    this.logDebug(
      `Server compile #${curId}: Triggered, version=${this.updateManager.docChangedVersion}, mode=${serverCompileOptions.mode}, mainFile=${mainFile}, from\n${stackLines}`,
    );
    if (!serverCompileOptions.skipCache) {
      cache = this.trackerCache.get(
        mainFile,
        compileOptions,
        false /*hasCompleted*/,
        serverCompileOptions.mode,
      );
      if (cache && cache.isUpToDate()) {
        this.logDebug(
          `Server compile #${curId}: Return cache at #${cache.getCompileId()}(${cache.getMode()})`,
        );
        return cache;
      } else {
        this.logDebug(
          `Server compile #${curId}: Cache miss because ${cache ? `it's outdated with version ${cache.getVersion()}` : "no cache available"}`,
        );
      }
    }
    let oldProgram = undefined;
    if (!serverCompileOptions.skipOldProgramFromCache) {
      const completedTracker = this.trackerCache.get(
        mainFile,
        compileOptions,
        true /* hasCompleted */,
        serverCompileOptions.mode,
      );
      oldProgram = await completedTracker?.getCompileResult();
      this.logDebug(
        `Server compile #${curId}: Use old program from cache: ${oldProgram ? `from #${completedTracker?.getCompileId() ?? "undefined"}` : "n/a"}`,
      );
    }

    const tracker = CompileTracker.compile(
      curId,
      this.updateManager,
      this.compilerHost,
      mainFile,
      compileOptions,
      serverCompileOptions.mode,
      oldProgram,
      (msg) => this.logDebug(msg),
    );
    this.trackerCache.set(mainFile, compileOptions, tracker);

    return tracker;
  }
}

class CompileCache {
  private coreCache: CompileCacheInternal;
  private fullCache: CompileCacheInternal;

  constructor(private log: (msg: string) => void) {
    this.coreCache = new CompileCacheInternal(log);
    this.fullCache = new CompileCacheInternal(log);
  }

  get(
    entrypoint: string,
    compileOption: CompilerOptions,
    completedOnly: boolean,
    mode: ServerCompileMode,
  ) {
    switch (mode) {
      case "core":
        // full cache can also be used for core, just return the latest one
        const core = this.coreCache.get(entrypoint, compileOption, completedOnly);
        const full = this.fullCache.get(entrypoint, compileOption, completedOnly);
        // only consider using full when it's already completed, otherwise, full compilation may take longer time
        if (core && full && full.isCompleted()) {
          if (full.getVersion() > core.getVersion()) {
            this.log(
              `Server compile: Using full cache (version ${full.getVersion()}) over core cache (version ${core.getVersion()})`,
            );
            return full;
          } else {
            return core;
          }
        } else if (core) {
          return core;
        } else if (full && full.isCompleted()) {
          this.log(
            `Server compile: Using full cache (version ${full.getVersion()}) over core cache which is unavailable`,
          );
          return full;
        } else {
          return undefined;
        }
      case "full":
        return this.fullCache.get(entrypoint, compileOption, completedOnly);
      default:
        // not expected, just in case, and we don't want to terminate because of cache in prod
        if (process.env.NODE_ENV === "development") {
          throw new Error(`Unexpected compile mode: ${mode}`);
        }
        return undefined;
    }
  }

  set(entrypoint: string, compileOption: CompilerOptions, tracker: CompileTracker) {
    const mode = tracker.getMode();
    switch (mode) {
      case "core":
        this.coreCache.set(entrypoint, compileOption, tracker);
        break;
      case "full":
        this.fullCache.set(entrypoint, compileOption, tracker);
        break;
      default:
        if (process.env.NODE_ENV === "development") {
          throw new Error(`Unexpected compile mode: ${mode}`);
        }
        return undefined;
    }
  }
}

class CompileCacheInternal {
  private cacheLatest = new Map<string, CompileTracker>();
  /** Cache for completed compilation which is needed when we need an old program but the latest one is still in progress */
  private cacheCompleted = new Map<string, CompileTracker>();

  constructor(private log: (msg: string) => void) {}

  private getCacheKey(entrypoint: string, compileOption: CompilerOptions): string {
    const normalizedEntrypoint = normalizePath(entrypoint);
    const normalizedOptions: CompilerOptions = {
      ...compileOption,
      outputDir: undefined,
    };

    return `${normalizedEntrypoint}\n${normalizedOptions}`;
  }

  /** Get the latest completed compilation */
  get(
    entrypoint: string,
    compileOption: CompilerOptions,
    /**
     * Whether to only return completed compilations
     */
    completedOnly: boolean,
  ): CompileTracker | undefined {
    const key = this.getCacheKey(entrypoint, compileOption);
    const tracker = this.cacheLatest.get(key);
    // completed cache is from latest cache, so if latest is undefined, no need to check completed cache any more
    if (!completedOnly || !tracker) {
      return tracker;
    }
    if (tracker.isCompleted() === true) {
      return tracker;
    }
    return this.cacheCompleted.get(key);
  }

  set(entrypoint: string, compileOption: CompilerOptions, tracker: CompileTracker) {
    const key = this.getCacheKey(entrypoint, compileOption);
    this.cacheLatest.set(key, tracker);
    const onComplete = () => {
      const cur = this.cacheCompleted.get(key);
      if (!cur || cur.getVersion() < tracker.getVersion()) {
        // There may be a race condition here when two onComplete occur at the same time(both of them pass the check and try to set the cache)
        // But the chance is very low, the cache status is still good (just set to a newer but not latest version), and the next compile can
        // likely fix it, so don't do special handling here for it
        this.cacheCompleted.set(key, tracker);
        this.log(
          `Server compile #${tracker.getCompileId()}: Completed Cache updated ( ${cur?.getVersion() ?? "n/a"} -> ${tracker.getVersion()} )`,
        );
      }
    };
    tracker.getCompileResult().then(
      () => {
        onComplete();
      },
      (err) => {
        onComplete();
      },
    );
  }
}

/**
 * Tracks one compilation's program promise, change version, timing, and captured compiler logs.
 * A cached tracker can be reused by multiple requests. Its completion state and logs evolve
 * while compilation runs; it is not an immutable snapshot of the server's current state.
 */
export class CompileTracker {
  private endTime: Date | undefined;

  /**
   * Start a compilation and capture its compiler log messages separately from server logging.
   * The change version is captured from the update manager at startup. The supplied log
   * callback receives compilation lifecycle messages; compiler messages remain in getLogs().
   * Core mode disables emitters and clears the linter rule set before invoking the compiler.
   */
  static compile(
    id: number,
    updateManager: UpdateManager,
    host: CompilerHost,
    mainFile: string,
    options: CompilerOptions = {},
    mode: ServerCompileMode,
    oldProgram: Program | undefined,
    log: (msg: string) => void,
  ) {
    const sLogs: ServerLog[] = [];
    // Clone an compilerhost instance with my logSink so that we can collect compiler logs
    // for each compilation to it's own tracker
    // Usually we don't want to send out the log because we are compiling aggressively in the lsp
    // but in some case like the 'emit-code', we will want to send back the logs if there is any
    const myHost: CompilerHost = {
      ...host,
      logSink: {
        log: (log: ProcessedLog) => {
          const msg = formatLog(log, { excludeLogLevel: true });
          const sLog: ServerLog = {
            level: log.level,
            message: msg,
          };
          sLogs.push(sLog);
        },
        trackAction: (message, finalMessage, action) =>
          trackActionFunc((log) => sLogs.push(log), message, finalMessage, action),
      },
    };
    const myOption: CompilerOptions =
      mode === "core"
        ? {
            ...options,
            emit: [],
            linterRuleSet: undefined,
          }
        : {
            ...options,
          };
    const version = updateManager.docChangedVersion;
    const startTime = new Date();
    const p = compileProgram(myHost, mainFile, myOption, oldProgram);
    log(
      `Server compile #${id}: Start compilation at ${startTime.toISOString()}, version = ${version}, mainFile = ${mainFile}, mode = ${mode}`,
    );
    return new CompileTracker(id, updateManager, mainFile, p, version, startTime, mode, sLogs, log);
  }

  private constructor(
    private id: number,
    private updateManager: UpdateManager,
    private entrypoint: string,
    private compileResultPromise: Promise<Program>,
    private version: number,
    private startTime: Date,
    private mode: ServerCompileMode,
    private logs: ServerLog[],
    log: (msg: string) => void,
  ) {
    this.startTime = startTime;
    const onComplete = () => {
      this.endTime = new Date();
      log(
        `Server compile #${this.getCompileId()}: Compilation finished at ${this.endTime.toISOString()}. Duration = ${this.endTime.getTime() - this.startTime.getTime()}ms`,
      );
    };
    compileResultPromise.then(
      (r) => {
        onComplete();
      },
      (err) => {
        onComplete();
      },
    );
  }

  /** Identifier supplied when this compilation was started; reused requests retain the same identifier. */
  getCompileId() {
    return this.id;
  }

  /** Entry-point path passed to the compiler, not the URI of the document that triggered the request. */
  getEntryPoint() {
    return this.entrypoint;
  }

  /** Await the program produced by this compilation; rejects if the underlying compilation fails. */
  async getCompileResult() {
    return await this.compileResultPromise;
  }

  /** Server-wide change version captured at startup, not an individual document's LSP version. */
  getVersion() {
    return this.version;
  }

  /** Startup time recorded for this compilation. The returned Date is not cloned. */
  getStartTime(): Date {
    return this.startTime;
  }

  /** Completion time after success or failure, or undefined while pending. The returned Date is not cloned. */
  getEndTime(): Date | undefined {
    return this.endTime;
  }

  /** Whether the compilation has settled, including failure; this does not indicate a successful program. */
  isCompleted(): boolean {
    return this.endTime !== undefined;
  }

  /** Whether the captured change version still matches the update manager's current version. */
  isUpToDate(): boolean {
    return this.version === this.updateManager.docChangedVersion;
  }

  /** Mode used to start this compilation, which may be full even when reused by a core-mode request. */
  getMode(): ServerCompileMode {
    return this.mode;
  }

  /** Captured compiler messages in arrival order; returns the backing array, which can grow until compilation settles. */
  getLogs(): ServerLog[] {
    return this.logs;
  }
}
