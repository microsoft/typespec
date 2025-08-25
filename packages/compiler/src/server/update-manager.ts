import { TextDocumentIdentifier } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  ENABLE_UPDATE_MANAGER_LOGGING,
  UPDATE_DEBOUNCE_TIME,
  UPDATE_PARALLEL_LIMIT,
} from "./constants.js";
import { ServerLog } from "./types.js";

interface PendingUpdate {
  latest: TextDocument | TextDocumentIdentifier;
  latestUpdateTimestamp: number;
}

type UpdateCallback = (updates: PendingUpdate[]) => Promise<void>;
/**
 * Track file updates and recompile the affected files after some debounce time.
 */
export class UpdateManger {
  #pendingUpdates = new Map<string, PendingUpdate>();
  #updateCb?: UpdateCallback;
  // overall version which should be bumped for any doc change
  #version = 0;
  #scheduleBatchUpdate: () => void;
  private _log: (sl: ServerLog) => void;

  constructor(log: (sl: ServerLog) => void) {
    // TODO: remove the || true before checkin
    this._log = process.env[ENABLE_UPDATE_MANAGER_LOGGING] || true ? log : () => {};

    this.#scheduleBatchUpdate = debounceThrottle(
      async () => {
        const updates = this.#pendingUpdates;
        this.#pendingUpdates = new Map<string, PendingUpdate>();
        if (updates.size > 0) {
          await this.#update(Array.from(updates.values()));
        }
      },
      UPDATE_DEBOUNCE_TIME,
      this._log,
    );
  }

  public setCallback(callback: UpdateCallback) {
    this.#updateCb = callback;
  }

  public get version() {
    return this.#version;
  }

  public scheduleUpdate(document: TextDocument | TextDocumentIdentifier) {
    this.#version++;
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
  milliseconds: number,
  log: (sl: ServerLog) => void,
): () => void {
  let timeout: any;
  let lastInvocation = Date.now() - milliseconds;
  let executingCount = 0;
  let debounceExecutionId = 0;

  function maybeCall() {
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
      if (Date.now() - lastInvocation < milliseconds || executingCount >= UPDATE_PARALLEL_LIMIT) {
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
    }, milliseconds);
  }

  return maybeCall;
}
