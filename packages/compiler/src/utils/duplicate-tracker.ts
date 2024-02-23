/**
 * Helper class to track duplicate instance
 */
export class DuplicateTracker<K, V> {
  #entries = new Map<K, V[]>();

  /**
   * Track usage of K.
   * @param k key that is being checked for duplicate.
   * @param v value that map to the key
   */
  track(k: K, v: V) {
    const existing = this.#entries.get(k);
    if (existing === undefined) {
      this.#entries.set(k, [v]);
    } else {
      existing.push(v);
    }
  }

  /**
   * Return iterator of all the duplicate entries.
   */
  *entries(): Iterable<[K, V[]]> {
    for (const [k, v] of this.#entries.entries()) {
      if (v.length > 1) {
        yield [k, v];
      }
    }
  }
}
