import { Program } from "@typespec/compiler";

export interface EmitterFilter {
  includedEmitters: string[];
  excludedEmitters: string[];
  isUnscoped: boolean;
}

export interface ScopedValue<T> {
  emitterFilter: EmitterFilter;
  value: T;
}

const clientStateMap = new WeakMap<Program, Map<symbol, Map<any, ScopedValue<any>>>>();

export function useClientStateMap<K, V>(
  symbol: symbol,
): [
  get: (program: Program, key: K) => ScopedValue<V> | undefined,
  set: (program: Program, key: K, value: ScopedValue<V>) => Map<K, ScopedValue<V>>,
  entries: (program: Program) => IterableIterator<[K, ScopedValue<V>]>,
] {
  type InnerMap = Map<K, ScopedValue<V>>;
  // Ensure we have a map for this program & symbol
  function getInnerMap(program: Program): InnerMap {
    let stateMap = clientStateMap.get(program);
    if (!stateMap) {
      stateMap = new Map<symbol, InnerMap>();
      clientStateMap.set(program, stateMap);
    }

    if (!stateMap.has(symbol)) {
      stateMap.set(symbol, new Map<V, ScopedValue<K>>());
    }
    return stateMap.get(symbol)!;
  }

  const get = (program: Program, key: K): ScopedValue<V> | undefined => {
    return getInnerMap(program).get(key);
  };

  const set = (program: Program, key: K, value: ScopedValue<V>): Map<K, ScopedValue<V>> => {
    return getInnerMap(program).set(key, value);
  };

  const entries = (program: Program): IterableIterator<[K, ScopedValue<V>]> => {
    return getInnerMap(program).entries();
  };

  return [get, set, entries];
}

export function parseScopeFilter(string: string | undefined): EmitterFilter {
  if (!string) {
    return {
      excludedEmitters: [],
      includedEmitters: [],
      isUnscoped: true,
    };
  }

  const parts = string.split(",");
  const includedEmitters: string[] = [];
  const excludedEmitters: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith("!")) {
      excludedEmitters.push(trimmed.substring(1));
    } else {
      includedEmitters.push(trimmed);
    }
  }

  return {
    excludedEmitters,
    includedEmitters,
    isUnscoped: false,
  };
}
