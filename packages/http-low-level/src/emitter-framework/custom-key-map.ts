export class CustomKeyMap<K extends readonly any[], V> {
  #currentId = 0;
  #idMap = new WeakMap<object, number>();
  #items = new Map<string, V>();
  #keyer;

  constructor(keyer: (args: K) => string) {
    this.#keyer = keyer;
  }

  get(items: K): V | undefined {
    return this.#items.get(this.#keyer(items));
  }

  set(items: K, value: V): void {
    const key = this.#keyer(items);
    this.#items.set(key, value);
  }

  static objectKeyer() {
    const knownKeys = new WeakMap<object, number>();
    let count = 0;
    return {
      getKey(o: object) {
        if (knownKeys.has(o)) {
          return knownKeys.get(o);
        }

        let key = count;
        count++;
        knownKeys.set(o, key);
        return key;
      },
    };
  }
}