import { getLocationContext, type Program, type Type } from "@typespec/compiler";

/**
 * Create a predicate telling whether a type was declared in the user project (as opposed to the compiler standard library or a library).
 * Results are cached as the same type is likely to be queried multiple times when building the type graph.
 */
export function createIsProjectTypePredicate(program: Program): (type: Type) => boolean {
  const cache = new Map<Type, boolean>();
  return (type: Type) => {
    const cached = cache.get(type);
    if (cached !== undefined) {
      return cached;
    }
    const result = getLocationContext(program, type).type === "project";
    cache.set(type, result);
    return result;
  };
}
