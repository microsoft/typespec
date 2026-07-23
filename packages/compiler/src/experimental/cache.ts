import type { Program } from "../core/program.js";
import type { Type } from "../core/types.js";

/**
 * Get a cached value for the given key, computing it if not already cached.
 * Caching is only active during the "validating" stage and later (not during "parsing" or "checking")
 * because decorators may mutate types during the checking stage, making cached values stale.
 *
 * @param program The program instance.
 * @param key A unique symbol identifying this cache namespace.
 * @param type The type to use as the cache key within this namespace.
 * @param compute A function that computes the value if not cached.
 * @returns The cached or freshly computed value.
 *
 * @experimental
 */
export function useCache<T>(program: Program, key: symbol, type: Type, compute: () => T): T {
  return program.useCache(key, type, compute);
}

/**
 * Invalidate cached values stored by {@link useCache}.
 * Call this when type graph mutations (e.g. Realm mutations) may have made
 * previously cached results stale.
 *
 * When `types` is provided, only cache entries for those specific types are
 * removed (surgical invalidation). When omitted, all caches are cleared.
 *
 * @param program The program instance.
 * @param types Optional set of types whose cache entries should be invalidated.
 *
 * @experimental
 */
export function invalidateCaches(program: Program, types?: Iterable<Type>): void {
  program.invalidateCaches(types);
}
