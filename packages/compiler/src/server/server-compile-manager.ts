import { formatLog } from "../core/logger/index.js";
import {
  compile as compileProgram,
  CompilerHost,
  CompilerOptions,
  normalizePath,
  ProcessedLog,
  Program,
  ServerLog,
} from "../index.js";
import { ENABLE_SERVER_COMPILE_LOGGING } from "./constants.js";
import { trackActionFunc } from "./server-track-action-task.js";
import { UpdateManger } from "./update-manager.js";

/**
 * core: linter and emitter will be set to [] when trigger compilation
 * full: compile as it is
 */
export type ServerCompileMode = "core" | "full";

export interface ServerCompileOptions {
  skipCache?: boolean;
  skipOldProgramFromCache?: boolean;
  /** Make this non-optinal on purpose so that the caller needs to determine the correct mode to compile explicitly */
  mode: ServerCompileMode;
  /** A simple func to check if the compilation is cancelled. After compiler supports cancellation, we may want to change to use it */
  isCancelled?: () => boolean;
}

/** All server compilation should be triggered from me */
export class ServerCompileManager {
  // We may want a ttl for this
  private trackerCache = new CompileCache((msg) => this.logDebug(msg));
  private compileId = 0;
  private logDebug: (msg: string) => void;

  constructor(
    private updateManager: UpdateManger,
    private compilerHost: CompilerHost,
    private log: (log: ServerLog) => void,
  ) {
    // TODO: remove the || true before check-in
    this.logDebug =
      process.env[ENABLE_SERVER_COMPILE_LOGGING] || true
        ? (msg) => this.log({ level: "debug", message: msg })
        : () => {};
  }

  async compile(
    mainFile: string,
    compileOptions: CompilerOptions = {},
    serverCompileOptions: ServerCompileOptions = {
      skipCache: false,
      skipOldProgramFromCache: false,
      mode: "full",
    },
  ): Promise<CompileTracker> {
    let cache = undefined;
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
    hasCompleted: boolean,
    mode: ServerCompileMode,
  ) {
    switch (mode) {
      case "core":
        // full cache can also be used for core, just return the latest one
        const core = this.coreCache.get(entrypoint, compileOption, hasCompleted);
        const full = this.fullCache.get(entrypoint, compileOption, hasCompleted);
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
        return this.fullCache.get(entrypoint, compileOption, hasCompleted);
      default:
        // not expected, just in case, and we dont want to terminal because of cache in prod
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
    hasCompleted: boolean,
  ): CompileTracker | undefined {
    const key = this.getCacheKey(entrypoint, compileOption);
    const tracker = this.cacheLatest.get(key);
    if (!hasCompleted || !tracker) {
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
        // likely fix it, so dont do speical handling here for it
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

export class CompileTracker {
  private endTime: Date | undefined;

  static compile(
    id: number,
    updateManager: UpdateManger,
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
    const myhost: CompilerHost = {
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
    const p = compileProgram(myhost, mainFile, myOption, oldProgram);
    log(
      `Server compile #${id}: Start compilation at ${startTime.toISOString()}, version = ${version}, mainFile = ${mainFile}, mode = ${mode}`,
    );
    return new CompileTracker(id, updateManager, mainFile, p, version, startTime, mode, sLogs, log);
  }

  private constructor(
    private id: number,
    private updateManager: UpdateManger,
    private entrypoint: string,
    private compileResultPromise: Promise<Program>,
    private version: number,
    private startTime: Date,
    private mode: ServerCompileMode,
    private logs: ServerLog[],
    private log: (msg: string) => void,
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

  getCompileId() {
    return this.id;
  }

  getEntryPoint() {
    return this.entrypoint;
  }

  async getCompileResult() {
    return await this.compileResultPromise;
  }

  getVersion() {
    return this.version;
  }

  getStartTime(): Date {
    return this.startTime;
  }

  getEndTime(): Date | undefined {
    return this.endTime;
  }

  isCompleted(): boolean {
    return this.endTime !== undefined;
  }

  isUpToDate(): boolean {
    return this.version === this.updateManager.docChangedVersion;
  }

  getMode(): ServerCompileMode {
    return this.mode;
  }

  getLogs(): ServerLog[] {
    return this.logs;
  }
}
