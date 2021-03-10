import fs from "fs";
import url from "url";

export const adlVersion = getVersion();

function getVersion(): string {
  const packageJsonPath = resolvePath(import.meta.url, "../../package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

export function resolvePath(basePath: string, ...parts: string[]): string {
  const resolvedPath = new url.URL(parts.join(""), basePath);
  return url.fileURLToPath(resolvedPath);
}
