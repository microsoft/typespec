import { formatDiagnostic } from "../core/logger/console-sink.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import { SystemHost, Diagnostic as TypeSpecDiagnostic } from "../core/types.js";
import { doIO, loadFile } from "../utils/io.js";
import { resolveTspMain } from "../utils/misc.js";
import { FileSystemCache } from "./file-system-cache.js";
import { ServerLog } from "./types.js";

export async function resolveEntrypointFile(
  host: SystemHost,
  entrypoints: string[] | undefined,
  path: string,
  fileSystemCache: FileSystemCache | undefined,
  log: (log: ServerLog) => void,
): Promise<string | undefined> {
  let packageJsonEntrypoint: string | undefined;
  let defaultEntrypoint: string | undefined;
  const options = { allowFileNotFound: true };

  const pathStat = await doIO(() => host.stat(path), path, logMainFileSearchDiagnostic, options);
  const isFilePath = pathStat?.isFile() ?? false;
  let dir = isFilePath ? getDirectoryPath(path) : path;

  while (true) {
    // Check for client provided entrypoints (highest priority)
    if (entrypoints && entrypoints.length > 0) {
      for (const entrypoint of entrypoints) {
        const candidate = await existingFile(dir, entrypoint);
        if (candidate) {
          log({
            level: "debug",
            message: `main file found using client provided entrypoint: ${candidate}`,
          });
          return candidate;
        }
      }
    }

    if (!packageJsonEntrypoint) {
      let pkg: any;
      const pkgPath = joinPaths(dir, "package.json");
      const cached = await fileSystemCache?.get(pkgPath);
      if (cached?.data) {
        pkg = cached.data;
      } else {
        [pkg] = await loadFile(host, pkgPath, JSON.parse, logMainFileSearchDiagnostic, options);
        await fileSystemCache?.setData(pkgPath, pkg ?? {});
      }

      const tspMain = resolveTspMain(pkg);
      if (typeof tspMain === "string") {
        log({
          level: "debug",
          message: `tspMain resolved from package.json (${pkgPath}) as ${tspMain}`,
        });
        packageJsonEntrypoint = await existingFile(dir, tspMain);
      }
    }

    if (!defaultEntrypoint && (entrypoints === undefined || entrypoints.length === 0)) {
      defaultEntrypoint = await existingFile(dir, "main.tsp");
    }

    const parentDir = getDirectoryPath(dir);
    if (parentDir === dir) {
      break;
    }

    dir = parentDir;
  }

  if (packageJsonEntrypoint) {
    log({ level: "debug", message: `entrypoint file found as ${packageJsonEntrypoint}` });
    return packageJsonEntrypoint;
  }

  if (defaultEntrypoint) {
    log({ level: "debug", message: `entrypoint file found as ${defaultEntrypoint}` });
    return defaultEntrypoint;
  }

  log({ level: "debug", message: `reached directory root, using '${path}' as main file` });
  return isFilePath ? path : undefined;

  function logMainFileSearchDiagnostic(diagnostic: TypeSpecDiagnostic) {
    log({
      level: `error`,
      message: `Unexpected diagnostic while looking for main file of ${path}`,
      detail: formatDiagnostic(diagnostic),
    });
  }

  async function existingFile(dir: string, file: string): Promise<string | undefined> {
    const candidate = joinPaths(dir, file);
    const stat = await doIO(
      () => host.stat(candidate),
      candidate,
      logMainFileSearchDiagnostic,
      options,
    );

    return stat?.isFile() ? candidate : undefined;
  }
}
