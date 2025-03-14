/**
 * Keeps track of a value we don't know yet because of a circular reference. Use
 * the `onValue` method to provide a callback with how to handle the
 * placeholder's value becoming available. Generally the callback will replace
 * this placeholder with the value in whatever references the placeholder.
 */
export class Placeholder<T> {
  #listeners: ((value: T) => void)[] = [];
  setValue(value: T) {
    for (const listener of this.#listeners) {
      listener(value);
    }
  }

  onValue(cb: (value: T) => void) {
    this.#listeners.push(cb);
  }
}
