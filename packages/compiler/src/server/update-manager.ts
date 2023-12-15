import { TextDocument } from "vscode-languageserver-textdocument";
import { UPDATE_DEBOUNCE_TIME } from "./constants.js";

interface PendingUpdate<T> {
  latest: TextDocument;
  callbacks: Map<string, (result: T) => unknown>;
}
/**
 * Track file updates and recompile the affected files after some debounce time.
 */
export class UpdateManger<T> {
  #pendingUpdates = new Map<string, PendingUpdate<T>>();
  #updateCb: (document: TextDocument) => Promise<T>;

  constructor(updateCb: (document: TextDocument) => Promise<T>) {
    this.#updateCb = updateCb;
  }

  public scheduleUpdate<U>(document: TextDocument, key: string, callback: (result: T) => U) {
    const existing = this.#pendingUpdates.get(document.uri);
    if (existing === undefined) {
      this.#pendingUpdates.set(document.uri, {
        callbacks: new Map([[key, callback]]),
        latest: document,
      });
    } else {
      existing.latest = document;
      existing.callbacks.set(key, callback);
    }
    this.#scheduleBatchUpdate();
  }

  #scheduleBatchUpdate = debounceThrottle(() => {
    this.#pendingUpdates.forEach((update) => {
      void this.#update(update);
    });
    this.#pendingUpdates.clear();
  }, UPDATE_DEBOUNCE_TIME);

  async #update(update: PendingUpdate<T>) {
    const result = await this.#updateCb(update.latest);
    for (const callback of update.callbacks.values()) {
      callback(result);
    }
  }
}

/**
 * Debounces a function but also waits at minimum the specified number of miliseconds until
 * the next invocation. This avoids needless calls when a synchronous call (like diagnostics)
 * took too long and the whole timeout of the next call was eaten up already.
 *
 * @param fn The function
 * @param milliseconds Number of milliseconds to debounce/throttle
 */
export function debounceThrottle(fn: () => void, milliseconds: number): () => void {
  let timeout: any;
  let lastInvocation = Date.now() - milliseconds;

  function maybeCall() {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      if (Date.now() - lastInvocation < milliseconds) {
        maybeCall();
        return;
      }

      fn();
      lastInvocation = Date.now();
    }, milliseconds);
  }

  return maybeCall;
}
