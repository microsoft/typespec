import { TextDocumentIdentifier } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ENABLE_UPDATE_MANAGER_LOGGING } from "./constants.js";
import { ServerLog } from "./types.js";

interface PendingUpdate {
  latest: TextDocument | TextDocumentIdentifier;
  latestUpdateTimestamp: number;
}

interface DelayCandidate {
  frequencyInWindow: number;
  delay: number;
}

export type UpdateType = "opened" | "changed" | "closed" | "renamed";

type UpdateCallback<T> = (
  updates: PendingUpdate[],
  triggeredBy: TextDocument | TextDocumentIdentifier,
) => Promise<T>;
/**
 * Track file updates and recompile the affected files after some debounce time.
 * T will be returned if the scheduled update is triggered eventually, but if a newer scheduleUpdate is triggered, the previous ones will be cancelled and return undefined.
 */
export class UpdateManager<T = void> {
  #pendingUpdates = new Map<string, PendingUpdate>();
  #updateCb?: UpdateCallback<T>;
  // overall version which should be bumped for any actual doc change
  #docChangedVersion = 0;
  #scheduleBatchUpdate: (
    triggeredBy: TextDocument | TextDocumentIdentifier,
  ) => Promise<T | undefined>;
  #docChangedTimesteps: number[] = [];
  #isStarted = false;

  private _log: (sl: ServerLog) => void;
  private getAdaptiveDebounceDelay: () => number;

  /**
   *
   * @param name For logging purpose, identify different update manager if there are multiple
   * @param log
   */
  constructor(
    private name: string,
    log: (sl: ServerLog) => void,
    getDelayCandidates?: () => DelayCandidate[],
  ) {
    this._log =
      typeof process !== "undefined" &&
      process?.env?.[ENABLE_UPDATE_MANAGER_LOGGING]?.toLowerCase() === "true"
        ? (sl: ServerLog) => {
            log({ ...sl, message: `#FromUpdateManager(${this.name}): ${sl.message}` });
          }
        : () => {};

    // Use provided getDelayCandidates function or default implementation
    const delayCandidates = getDelayCandidates?.() ?? this.getDefaultDelayCandidates();
    this.getAdaptiveDebounceDelay = (): number => {
      const frequent = this.getWindowedDocChangedTimesteps().length;

      for (const c of delayCandidates) {
        if (frequent >= c.frequencyInWindow) {
          return c.delay;
        }
      }
      return 500; // fallback default delay
    };

    this.#scheduleBatchUpdate = debounceThrottle<
      T | undefined,
      TextDocument | TextDocumentIdentifier
    >(
      async (arg: TextDocument | TextDocumentIdentifier) => {
        const updates = this.#pendingUpdates;
        this.#pendingUpdates = new Map<string, PendingUpdate>();
        return await this.#update(Array.from(updates.values()), arg);
      },
      () => (this.#isStarted ? "ready" : "pending"),
      this.getAdaptiveDebounceDelay,
      this._log,
    );
  }

  private getDefaultDelayCandidates(): DelayCandidate[] {
    // Provider different debounce delay according to whether usr are actively typing, increase the delay if so to avoid unnecessary invoke
    // The category below is suggested from AI, may adjust as needed in the future
    return [
      // IMPORTANT: sort by frequencyInWindow desc, we will pick the first match
      {
        // active typing
        frequencyInWindow: 20,
        delay: 1000,
      },
      {
        // moderate typing
        frequencyInWindow: 10,
        delay: 800,
      },
      {
        // light typing
        frequencyInWindow: 0,
        delay: 500,
      },
    ];
  }

  /**
   * Callback will only be invoked after start() is called.
   * We need to start explicitly to avoid compiling with incorrect settings when the lsp hasn't fully initialized (the client settings are not loaded yet.)
   */
  public start() {
    this.#isStarted = true;
  }

  public setCallback(callback: UpdateCallback<T>) {
    this.#updateCb = callback;
  }

  public get docChangedVersion() {
    return this.#docChangedVersion;
  }

  private bumpDocChangedVersion() {
    this.#docChangedVersion++;
  }

  private pushDocChangedTimestamp() {
    const now = Date.now();
    this.#docChangedTimesteps = [...this.getWindowedDocChangedTimesteps(), now];
  }

  private readonly WINDOW = 5000;

  private getWindowedDocChangedTimesteps(): number[] {
    const now = Date.now();
    return this.#docChangedTimesteps.filter((timestamp) => {
      const age = now - timestamp;
      return age < this.WINDOW;
    });
  }

  /**
   * T will be returned if the schedule is triggered eventually, if a newer scheduleUpdate
   *  occurs before the debounce time, the previous ones will be cancelled and return undefined.
   */
  public scheduleUpdate(
    document: TextDocument | TextDocumentIdentifier,
    updateType: UpdateType,
  ): Promise<T | undefined> {
    if (updateType === "changed" || updateType === "renamed") {
      // only bump this when the file is actually changed
      // skip open
      this.bumpDocChangedVersion();
      this.pushDocChangedTimestamp();
    }
    const existing = this.#pendingUpdates.get(document.uri);
    if (existing === undefined) {
      this.#pendingUpdates.set(document.uri, {
        latest: document,
        latestUpdateTimestamp: Date.now(),
      });
    } else {
      existing.latest = document;
      existing.latestUpdateTimestamp = Date.now();
    }
    return this.#scheduleBatchUpdate(document);
  }

  async #update(
    updates: PendingUpdate[],
    arg: TextDocument | TextDocumentIdentifier,
  ): Promise<T | undefined> {
    if (this.#updateCb === undefined) {
      this._log({
        level: "warning",
        message: `No update callback registered, skip invoking update.`,
      });
      return undefined;
    }
    return await this.#updateCb(updates, arg);
  }
}

/**
 * Debounces a function but also waits at minimum the specified number of milliseconds until
 * the next invocation. This avoids needless calls when a synchronous call (like diagnostics)
 * took too long and the whole timeout of the next call was eaten up already.
 *
 * @param fn The function
 * @param getFnStatus Fn will only be called when this returns "ready"
 * @param milliseconds Number of milliseconds to debounce/throttle
 */
export function debounceThrottle<T, P>(
  fn: (arg: P) => T | Promise<T>,
  getFnStatus: () => "ready" | "pending",
  getDelay: () => number,
  log: (sl: ServerLog) => void,
): (arg: P) => Promise<T | undefined> {
  let timeout: any;
  let lastInvocation: number | undefined = undefined;
  let executingCount = 0;
  let debounceExecutionId = 0;
  const executionPromises = new Map<number, DeferredPromise<T | undefined>>();
  const UPDATE_PARALLEL_LIMIT = 2;

  function maybeCall(arg: P): Promise<T | undefined> {
    const promise = new DeferredPromise<T | undefined>();
    const curId = debounceExecutionId++;
    executionPromises.set(curId, promise);
    maybeCallInternal(curId, arg, promise);
    return promise.getPromise();
  }

  /** Clear all promises before the given id to make sure we are not leaking anything */
  function clearPromisesBefore(id: number) {
    // clear all promises before with id < the given id
    for (const k of executionPromises.keys()) {
      if (k < id) {
        executionPromises.get(k)?.resolvePromise(undefined);
        executionPromises.delete(k);
      }
    }
  }

  function maybeCallInternal(id: number, arg: P, promise: DeferredPromise<T | undefined>) {
    clearTimeout(timeout);
    clearPromisesBefore(id);

    timeout = setTimeout(async () => {
      const delay = getDelay();
      const tooSoon = lastInvocation !== undefined && Date.now() - lastInvocation < delay;
      const notReady = getFnStatus() !== "ready";
      const tooManyParallel = executingCount >= UPDATE_PARALLEL_LIMIT;
      if (notReady || tooSoon || tooManyParallel) {
        maybeCallInternal(id, arg, promise);
        return;
      }
      const s = new Date();
      try {
        executingCount++;
        log({
          level: "debug",
          message: `Starting debounce execution #${id} at ${s.toISOString()}. Current parallel count: ${executingCount}`,
        });
        const r = await fn(arg);
        promise.resolvePromise(r);
      } catch (e) {
        promise.rejectPromise(e);
      } finally {
        executionPromises.delete(id);
        executingCount--;
        const e = new Date();
        log({
          level: "debug",
          message: `Finish debounce execution #${id} at ${e.toISOString()}, duration=${e.getTime() - s.getTime()}. Current parallel count: ${executingCount}`,
        });
      }
      lastInvocation = Date.now();
    }, getDelay());
  }

  return maybeCall;
}

class DeferredPromise<T> {
  #promise: Promise<T>;
  #resolve!: (value: T) => void;
  #reject!: (reason?: any) => void;

  constructor() {
    this.#promise = new Promise<T>((res, rej) => {
      this.#resolve = res;
      this.#reject = rej;
    });
  }

  getPromise(): Promise<T> {
    return this.#promise;
  }

  resolvePromise(value: T) {
    this.#resolve(value);
  }

  rejectPromise(reason?: any) {
    this.#reject(reason);
  }
}
