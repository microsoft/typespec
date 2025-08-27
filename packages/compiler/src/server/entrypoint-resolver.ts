import { NodeSystemHost } from "../core/node-system-host.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import { resolveTspMain } from "../utils/misc.js";
import { ServerLog } from "./types.js";

export async function resolveEntrypointFile(
  entrypoints: string[] | undefined,
  path: string,
  log: (log: ServerLog) => void,
): Promise<string> {
  let dir = getDirectoryPath(path);
  let packageJsonEntrypoint: string | undefined;
  let defaultEntrypoint: string | undefined;

  while (true) {
    // Check for client provided entrypoints (highest priority)
    for (const entrypoint of entrypoints ?? []) {
      const candidate = joinPaths(dir, entrypoint);
      const stat = await NodeSystemHost.stat(candidate);
      if (stat?.isFile()) {
        log({
          level: "debug",
          message: `main file found using client provided entrypoint: ${candidate}`,
        });
        return candidate;
      }
    }

    if (!packageJsonEntrypoint) {
      const pkgPath = joinPaths(dir, "package.json");
      const content = await NodeSystemHost.readFile(pkgPath);
      const pkg = JSON.parse(content.text);
      const tspMain = resolveTspMain(pkg);
      if (typeof tspMain === "string") {
        log({
          level: "debug",
          message: `tspMain resolved from package.json (${pkgPath}) as ${tspMain}`,
        });
        const candidate = joinPaths(dir, tspMain);
        const stat = await NodeSystemHost.stat(candidate);
        if (stat?.isFile()) {
          log({ level: "debug", message: `main file found as ${candidate}` });
          packageJsonEntrypoint = candidate;
        }
      }
    }

    if (!defaultEntrypoint && (entrypoints === undefined || entrypoints.length === 0)) {
      const candidate = joinPaths(dir, "main.tsp");
      const stat = await NodeSystemHost.stat(candidate);
      if (stat?.isFile()) {
        defaultEntrypoint = candidate;
      }
      if (defaultEntrypoint && log) {
        log({ level: "debug", message: `main file found as ${defaultEntrypoint}` });
      }
    }

    const parentDir = getDirectoryPath(dir);
    if (parentDir === dir) {
      break;
    }

    dir = parentDir;
  }

  if (packageJsonEntrypoint) {
    return packageJsonEntrypoint;
  }

  if (defaultEntrypoint) {
    return defaultEntrypoint;
  }

  log({ level: "debug", message: `reached directory root, using ${path} as main file` });
  return path;
}
