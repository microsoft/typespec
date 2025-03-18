/**
 * This is a map type that allows providing a custom keyer function. The keyer
 * function returns a string that is used to look up in the map. This is useful
 * for implementing maps that look up based on an arbitrary number of keys.
 *
 * For example, to look up in a map with a [ObjA, ObjB)] tuple, such that tuples
 * with identical values (but not necessarily identical tuples!) create an
 * object keyer for each of the objects:
 *
 *     const aKeyer = CustomKeyMap.objectKeyer();
 *     const bKeyer = CUstomKeyMap.objectKeyer();
 *
 * And compose these into a tuple keyer to use when instantiating the custom key
 * map:
 *
 *     const tupleKeyer = ([a, b]) => `${aKeyer.getKey(a)}-${bKeyer.getKey(b)}`;
 *     const map = new CustomKeyMap(tupleKeyer);
 *
 */
export class CustomKeyMap<K extends readonly any[], V> {
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

        const key = count;
        count++;
        knownKeys.set(o, key);
        return key;
      },
    };
  }
}
