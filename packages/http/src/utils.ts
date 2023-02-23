/**
 * Extract params to be interpolated(Wrapped in '{' and '}'}) from a path/url.
 * @param path Path/Url
 *
 * @example "foo/{name}/bar" -> ["name"]
 */
export function extractParamsFromPath(path: string): string[] {
  return path.match(/\{\w+\}/g)?.map((s) => s.slice(1, -1)) ?? [];
}
