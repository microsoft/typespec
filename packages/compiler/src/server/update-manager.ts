import { TextDocumentIdentifier } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { UPDATE_DEBOUNCE_TIME, UPDATE_PARALLEL_LIMIT } from "./constants.js";

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
  #lastUpdatedDocument: TextDocument | TextDocumentIdentifier | undefined;

  constructor() {}

  public setCallback(callback: UpdateCallback) {
    this.#updateCb = callback;
  }

  public get version() {
    return this.#version;
  }

  public get lastUpdatedDocument() {
    return this.#lastUpdatedDocument;
  }

  public scheduleUpdate(document: TextDocument | TextDocumentIdentifier) {
    this.#version++;
    this.#lastUpdatedDocument = document;
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

  #scheduleBatchUpdate = debounceThrottle(async () => {
    const updates = [...this.#pendingUpdates.values()];
    this.#pendingUpdates.clear();
    if (updates.length > 0) {
      await this.#update(updates);
    }
  }, UPDATE_DEBOUNCE_TIME);

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
export function debounceThrottle(fn: () => void | Promise<void>, milliseconds: number): () => void {
  let timeout: any;
  let lastInvocation = Date.now() - milliseconds;
  let executingCount = 0;
  let id = 0;

  function maybeCall() {
    console.debug("clear timeout");
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
      // a new run is triggered, cancel the last one as early as possible
      // Also give a parallel limitation
      // TODO: may not be needed after we support cancellation in compile()
      if (Date.now() - lastInvocation < milliseconds || executingCount >= UPDATE_PARALLEL_LIMIT) {
        maybeCall();
        return;
      }
      id++;
      executingCount++;
      const curId = id;
      const s = new Date();
      console.debug(
        `Start debounce execution #${curId} (parallel: ${executingCount}): Start: ${s.toISOString()}`,
      );
      await fn();
      executingCount--;
      const e = new Date();
      console.debug(
        `End debounce execution #${curId} (parallel: ${executingCount}): end: ${e.toISOString()} duration ${e.getTime() - s.getTime()}ms`,
      );
      lastInvocation = Date.now();
    }, milliseconds);
  }

  return maybeCall;
}
