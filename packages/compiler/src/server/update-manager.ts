import { TextDocument } from "vscode-languageserver-textdocument";
import { UPDATE_DEBOUNCE_TIME } from "./constants.js";

interface PendingUpdate {
  latest: TextDocument;
}
/**
 * Track file updates and recompile the affected files after some debounce time.
 */
export class UpdateManger<T> {
  #pendingUpdates = new Map<string, PendingUpdate>();
  #updateCb: (document: TextDocument) => Promise<T>;

  constructor(updateCb: (document: TextDocument) => Promise<T>) {
    this.#updateCb = updateCb;
  }

  public scheduleUpdate(document: TextDocument) {
    const existing = this.#pendingUpdates.get(document.uri);
    if (existing === undefined) {
      this.#pendingUpdates.set(document.uri, {
        latest: document,
      });
    } else {
      existing.latest = document;
    }
    this.#scheduleBatchUpdate();
  }

  #scheduleBatchUpdate = debounceThrottle(() => {
    this.#pendingUpdates.forEach((update) => {
      void this.#update(update);
    });
    this.#pendingUpdates.clear();
  }, UPDATE_DEBOUNCE_TIME);

  async #update(update: PendingUpdate) {
    await this.#updateCb(update.latest);
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
