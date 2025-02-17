import * as cl from "@typespec/http-client";

const flattenCache: WeakMap<cl.Client, cl.Client[]> = new WeakMap();
/**
 * Flatten the client hierarchy into a single-level array,
 * caching the result to avoid recomputing.
 */
export function flattenClients(client: cl.Client): cl.Client[] {
  // If we already have a cached value for this client, return it.
  if (flattenCache.has(client)) {
    return flattenCache.get(client)!;
  }

  // Otherwise, do a DFS/BFS to gather all subClients.
  const result: cl.Client[] = [];
  const stack: cl.Client[] = [client];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);
    // Add sub-clients to the stack
    stack.push(...current.subClients);
  }

  // Store the result in the cache before returning
  flattenCache.set(client, result);
  return result;
}
