/**
 * Keeps track of a value we don't know yet because of a circular reference. Use
 * the `onValue` method to provide a callback with how to handle the
 * placeholder's value becoming available. Generally the callback will replace
 * this placeholder with the value in whatever references the placeholder.
 */
export class Placeholder<T> {
  #listeners: ((value: T) => void)[] = [];
  /**
   * Synchronously notify registered listeners in registration order.
   * Does not store the value or clear listeners; repeated calls notify them again.
   */
  setValue(value: T) {
    for (const listener of this.#listeners) {
      listener(value);
    }
  }

  /**
   * Subscribe to future values. Register before `setValue` is called: previously
   * published values are not replayed, and the subscription cannot be removed.
   */
  onValue(cb: (value: T) => void) {
    this.#listeners.push(cb);
  }
}
