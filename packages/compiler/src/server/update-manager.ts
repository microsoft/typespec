import { TextDocumentIdentifier } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ENABLE_UPDATE_MANAGER_LOGGING } from "./constants.js";
import { ServerLog } from "./types.js";

interface PendingUpdate {
  latest: TextDocument | TextDocumentIdentifier;
  latestUpdateTimestamp: number;
}

export type UpdateType = "opened" | "changed";

type UpdateCallback = (updates: PendingUpdate[]) => Promise<void>;
/**
 * Track file updates and recompile the affected files after some debounce time.
 */
export class UpdateManger {
  #pendingUpdates = new Map<string, PendingUpdate>();
  #updateCb?: UpdateCallback;
  // overall version which should be bumped for any actual doc change
  #docChangedVersion = 0;
  #scheduleBatchUpdate: () => void;
  #docChangedTimesteps: number[] = [];

  private _log: (sl: ServerLog) => void;

  constructor(log: (sl: ServerLog) => void) {
    // TODO: remove the || true before checkin
    this._log =
      process.env[ENABLE_UPDATE_MANAGER_LOGGING] || true
        ? (sl: ServerLog) => {
            log({ ...sl, message: `#FromUpdateManager: ${sl.message}` });
          }
        : () => {};

    this.#scheduleBatchUpdate = debounceThrottle(
      async () => {
        const updates = this.#pendingUpdates;
        this.#pendingUpdates = new Map<string, PendingUpdate>();
        if (updates.size > 0) {
          await this.#update(Array.from(updates.values()));
        }
      },
      this.getAdaptiveDebounceDelay,
      this._log,
    );
  }

  public setCallback(callback: UpdateCallback) {
    this.#updateCb = callback;
  }

  public get docChangedVersion() {
    return this.#docChangedVersion;
  }

  private pushDocChangedTimestamp() {
    const now = Date.now();
    this.#docChangedTimesteps = [...this.getWindowedDocChangedTimesteps(), now];
  }

  private readonly WINDOW = 5000;
  private readonly DEFAULT_DELAY = 500;
  // Provider different debounce delay according to whether usr are actively typing, increase the delay if so to avoid unnecessary invoke
  // The category below is suggested from AI, may adjust as needed in the future
  private readonly DELAY_CANIDATES = [
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
      delay: this.DEFAULT_DELAY,
    },
  ];

  private getWindowedDocChangedTimesteps(): number[] {
    const now = Date.now();
    return this.#docChangedTimesteps.filter((timestamp) => {
      const age = now - timestamp;
      return age < this.WINDOW;
    });
  }

  private getAdaptiveDebounceDelay = (): number => {
    const frequent = this.getWindowedDocChangedTimesteps().length;

    for (const c of this.DELAY_CANIDATES) {
      if (frequent >= c.frequencyInWindow) {
        return c.delay;
      }
    }
    return this.DEFAULT_DELAY;
  };

  public scheduleUpdate(document: TextDocument | TextDocumentIdentifier, UpdateType: UpdateType) {
    if (UpdateType === "changed") {
      // only bump this when the file is actually changed
      // skip open
      this.#docChangedVersion++;
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
    this.#scheduleBatchUpdate();
  }

  async #update(updates: PendingUpdate[]) {
    await this.#updateCb?.(updates);
  }
}

/**
 * Debounces a function but also waits at minimum the specified number of milliseconds until
 * the next invocation. This avoids needless calls when a synchronous call (like diagnostics)
 * took too long and the whole timeout of the next call was eaten up already.
 *
 * @param fn The function
 * @param milliseconds Number of milliseconds to debounce/throttle
 */
export function debounceThrottle(
  fn: () => void | Promise<void>,
  getDelay: () => number,
  log: (sl: ServerLog) => void,
): () => void {
  let timeout: any;
  let lastInvocation: number | undefined = undefined;
  let executingCount = 0;
  let debounceExecutionId = 0;
  const UPDATE_PARALLEL_LIMIT = 2;

  function maybeCall() {
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
      if (
        lastInvocation !== undefined &&
        (Date.now() - lastInvocation < getDelay() || executingCount >= UPDATE_PARALLEL_LIMIT)
      ) {
        maybeCall();
        return;
      }
      const curId = debounceExecutionId++;
      const s = new Date();
      try {
        executingCount++;
        log({
          level: "debug",
          message: `Starting debounce execution #${curId} at ${s.toISOString()}. Current parallel count: ${executingCount}`,
        });
        await fn();
      } finally {
        executingCount--;
        const e = new Date();
        log({
          level: "debug",
          message: `Finish debounce execution #${curId} at ${e.toISOString()}, duration=${e.getTime() - s.getTime()}. Current parallel count: ${executingCount}`,
        });
      }
      lastInvocation = Date.now();
    }, getDelay());
  }

  return maybeCall;
}
