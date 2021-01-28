import url from "url";

export function resolvePath(basePath: string, ...parts: string[]): string {
  const resolvedPath = new url.URL(parts.join(''), basePath);
  return url.fileURLToPath(resolvedPath);
}
