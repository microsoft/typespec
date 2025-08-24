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
import { trackActionFunc } from "./server-track-action-task.js";
import { UpdateManger } from "./update-manager.js";

/**
 * core: linter and emitter will be set to [] when trigger compilation
 * full: compile as it is
 */
export type CompileMode = "core" | "full";

export interface CompileTrackerOptions {
  skipCache: boolean;
  skipOldProgramFromCache: boolean;
  mode: CompileMode;
}

/** All server compilation should be triggered from me */
export class CompileTrackerManager {
  // We may want a ttl for this
  private trackerCache = new CompileCache();
  private compileId = 0;

  constructor(
    private updateManager: UpdateManger,
    private host: CompilerHost,
  ) {}

  async compile(
    mainFile: string,
    compileOptions: CompilerOptions = {},
    trackerOptions: CompileTrackerOptions = {
      skipCache: false,
      skipOldProgramFromCache: false,
      mode: "full",
    },
  ): Promise<CompileTracker> {
    let cache = undefined;
    const curId = this.compileId++;
    const err = new Error();
    const lines = err.stack?.split("\n") ?? [];
    const caller = [lines[1], lines[2], lines[3]].join("\n");
    console.debug(
      `Server compile #${curId}: Triggered, version=${this.updateManager.version}, mainFile=${mainFile}\n${caller}`,
    );
    if (!trackerOptions.skipCache) {
      cache = this.trackerCache.get(mainFile, compileOptions, false, trackerOptions.mode);
      if (cache && cache.isUpToDate()) {
        console.debug(`Server compile #${curId}: Return cache`);
        return cache;
      } else {
        console.debug(
          `Server compile #${curId}: Cache miss because ${cache ? `it's outdated with version ${cache.getVersion()}` : "no cache available"}`,
        );
      }
    }
    let oldProgram = undefined;
    if (!trackerOptions.skipOldProgramFromCache) {
      const completedTracker = this.trackerCache.get(
        mainFile,
        compileOptions,
        true,
        trackerOptions.mode,
      );
      oldProgram = await completedTracker?.getCompileResult();
      console.debug(
        `Server compile #${curId}: Use old program from cache: ${oldProgram ? "available" : "n/a"}`,
      );
    }
    // BEFORE CHECKIN: remove below
    oldProgram = undefined;

    const tracker = CompileTracker.compile(
      curId,
      this.updateManager,
      this.host,
      mainFile,
      compileOptions,
      trackerOptions.mode,
      oldProgram,
    );
    this.trackerCache.set(mainFile, compileOptions, tracker);

    return tracker;
  }
}

class CompileCache {
  private coreCache = new CompileCacheInternal();
  private fullCache = new CompileCacheInternal();

  get(
    entrypiont: string,
    compileOption: CompilerOptions,
    hasCompleted: boolean,
    mode: CompileMode,
  ) {
    switch (mode) {
      case "core":
        // full cache can also be used for core, just return the latest one
        const core = this.coreCache.get(entrypiont, compileOption, hasCompleted);
        const full = this.fullCache.get(entrypiont, compileOption, hasCompleted);
        // only consider using full when it's already completed, otherwise, full compilation may take longer time
        if (core && full && full.isCompleted()) {
          if (full.getVersion() > core.getVersion()) {
            console.debug(
              `Server compile: Using full cache (version ${full.getVersion()}) over core cache (version ${core.getVersion()})`,
            );
            return full;
          } else {
            return core;
          }
        } else if (core) {
          return core;
        } else if (full && full.isCompleted()) {
          console.debug(
            `Server compile: Using full cache (version ${full.getVersion()}) over core cache which is unavailable`,
          );
          return full;
        } else {
          return undefined;
        }
      case "full":
        return this.fullCache.get(entrypiont, compileOption, hasCompleted);
      default:
        // not expected, just in case;
        throw new Error(`Unexpected compile mode: ${mode}`);
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
        // not expected, just in case;
        throw new Error(`Unexpected compile mode: ${mode}`);
    }
  }
}

class CompileCacheInternal {
  private cacheLatest = new Map<string, CompileTracker>();
  /** Cache for completed compilation which is needed when we need a program but the latest one is still in progress */
  private cacheCompleted = new Map<string, CompileTracker>();

  constructor() {}

  private getCacheKey(entrypoint: string, compileOption: CompilerOptions): string {
    const normalizedEntrypoint = normalizePath(entrypoint);
    const optionKey = JSON.stringify(compileOption);
    return `${normalizedEntrypoint}:${optionKey}`;
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
    const completed = this.cacheCompleted.get(key);
    if (!completed) {
      return undefined;
    }
    return completed;
  }

  set(entrypoint: string, compileOption: CompilerOptions, tracker: CompileTracker) {
    const key = this.getCacheKey(entrypoint, compileOption);
    this.cacheLatest.set(key, tracker);
    const onComplete = () => {
      const cur = this.cacheCompleted.get(key);
      if (!cur || cur.getVersion() < tracker.getVersion()) {
        this.cacheCompleted.set(key, tracker);
        console.debug(
          `Server compile #${tracker.getCompileId()}: Cache updated with new completed compilation`,
        );
      }
    };
    void tracker.getCompileResult().then(
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
    mode: CompileMode,
    oldProgram?: Program,
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
    const version = updateManager.version;
    const startTime = new Date();
    const p = compileProgram(myhost, mainFile, myOption, oldProgram);
    console.debug(
      `Server compile #${id}: Start compilation at ${startTime.toISOString()}, version = ${version}, mainFile = ${mainFile}, mode = ${mode}`,
    );
    return new CompileTracker(id, updateManager, mainFile, p, version, startTime, mode, sLogs);
  }

  private constructor(
    private id: number,
    private updateManager: UpdateManger,
    private entrypoint: string,
    private compileResultPromise: Promise<Program>,
    private version: number,
    private startTime: Date,
    private mode: CompileMode,
    private logs: ServerLog[],
  ) {
    this.startTime = startTime;
    const onComplete = () => {
      this.endTime = new Date();
      console.debug(
        `Server compile #${this.getCompileId()}: Compilation finished at ${this.endTime.toISOString()}. Duration = ${this.endTime.getTime() - this.startTime.getTime()}ms`,
      );
    };
    void compileResultPromise.then(
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
    return this.version === this.updateManager.version;
  }

  getMode(): CompileMode {
    return this.mode;
  }

  getLogs(): ServerLog[] {
    return this.logs;
  }
}
