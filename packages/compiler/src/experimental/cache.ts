import type { Program } from "../core/program.js";
import type { Type } from "../core/types.js";

/**
 * Get a cached value for the given key, computing it if not already cached.
 * Caching is only active from the "validating" stage onward and only for
 * finished types. During "parsing" and "checking", decorators are still being
 * applied. Unfinished types (during decorator application or inside mutators)
 * are never cached because the type graph may not yet be in a stable state.
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
  const stage = program.currentStage;
  // Only cache from "validating" onward. During "parsing" and "checking",
  // decorators are still being applied and may not have finished setting up
  // route options, filters, or other state that affects resolution. By
  // "validating" all decorators have completed and types are fully resolved.
  if (stage !== "validating" && stage !== "linting" && stage !== "emitting") {
    return compute();
  }
  // Don't cache results for unfinished types. Types are unfinished during
  // decorator application (including late template instantiation in the
  // emitting stage) and inside mutators. Caching at those points risks
  // storing results computed against an incomplete type graph.
  if (!type.isFinished) {
    return compute();
  }
  const map = program.stateMap(key);
  const existing = map.get(type);
  if (existing !== undefined) {
    return existing as T;
  }
  const value = compute();
  map.set(type, value);
  return value;
}
