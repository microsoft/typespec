import { NodeSystemHost } from "../core/node-system-host.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import { ServerLog } from "../server/types.js";
import { resolveTspMain } from "../utils/misc.js";

export async function getEntrypointFile(
  entrypoints: string[] | undefined,
  path: string,
  log: undefined | ((log: ServerLog) => void) = undefined,
): Promise<string> {
  let dir = getDirectoryPath(path);
  let packageJsonEntrypoint: string | undefined;
  let defaultEntrypoint: string | undefined;

  while (true) {
    if (entrypoints && entrypoints.length > 0) {
      // Check for client provided entrypoints (highest priority)
      for (const entrypoint of entrypoints) {
        const candidate = await existingFile(dir, entrypoint);
        if (candidate) {
          if (log) {
            log({
              level: "debug",
              message: `main file found using client provided entrypoint: ${candidate}`,
            });
          }
          return candidate;
        }
      }
    }

    if (!packageJsonEntrypoint) {
      const pkgPath = joinPaths(dir, "package.json");
      const content = await NodeSystemHost.readFile(pkgPath);
      const pkg = JSON.parse(content.text);
      const tspMain = resolveTspMain(pkg);
      if (typeof tspMain === "string") {
        if (log) {
          log({
            level: "debug",
            message: `tspMain resolved from package.json (${pkgPath}) as ${tspMain}`,
          });
        }
        packageJsonEntrypoint = await existingFile(dir, tspMain);
        if (packageJsonEntrypoint && log) {
          log({ level: "debug", message: `main file found as ${packageJsonEntrypoint}` });
        }
      }
    }

    if (!defaultEntrypoint) {
      defaultEntrypoint = await existingFile(dir, "main.tsp");
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

  if (log) {
    log({ level: "debug", message: `reached directory root, using ${path} as main file` });
  }
  return path;

  async function existingFile(dir: string, fileName: string): Promise<string | undefined> {
    const candidate = joinPaths(dir, fileName);
    const stat = await NodeSystemHost.stat(candidate);
    return stat?.isFile() ? candidate : undefined;
  }
}
