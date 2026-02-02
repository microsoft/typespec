export class CycleTracker<T> {
  #items: T[] = [];

  add(type: T): T[] | undefined {
    const existingIndex = this.#items.indexOf(type);
    if (existingIndex !== -1) {
      return this.#items.slice(existingIndex);
    }
    this.#items.push(type);
    return undefined;
  }
}
