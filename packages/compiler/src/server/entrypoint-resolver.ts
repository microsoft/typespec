import { formatDiagnostic } from "../core/logger/console-sink.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import { SystemHost, Diagnostic as TypeSpecDiagnostic } from "../core/types.js";
import { doIO, loadFile } from "../utils/io.js";
import { resolveTspMain } from "../utils/misc.js";
import { ServerLog } from "./types.js";

export async function resolveEntrypointFile(
  host: SystemHost,
  entrypoints: string[] | undefined,
  dir: string,
  log: (log: ServerLog) => void,
  path: string,
): Promise<string> {
  let packageJsonEntrypoint: string | undefined;
  let defaultEntrypoint: string | undefined;
  const options = { allowFileNotFound: true };

  while (true) {
    // Check for client provided entrypoints (highest priority)
    for (const entrypoint of entrypoints ?? []) {
      const candidate = await existingFile(dir, entrypoint);
      if (candidate) {
        log({
          level: "debug",
          message: `main file found using client provided entrypoint: ${candidate}`,
        });
        return candidate;
      }
    }

    if (!packageJsonEntrypoint) {
      const pkgPath = joinPaths(dir, "package.json");
      const [pkg] = await loadFile(host, pkgPath, JSON.parse, logMainFileSearchDiagnostic, options);
      const tspMain = resolveTspMain(pkg);
      if (typeof tspMain === "string") {
        log({
          level: "debug",
          message: `tspMain resolved from package.json (${pkgPath}) as ${tspMain}`,
        });
        packageJsonEntrypoint = await existingFile(dir, tspMain);
        if (packageJsonEntrypoint) {
          log({ level: "debug", message: `main file found as ${packageJsonEntrypoint}` });
        }
      }
    }

    if (!defaultEntrypoint && (entrypoints === undefined || entrypoints.length === 0)) {
      defaultEntrypoint = await existingFile(dir, "main.tsp");
      if (defaultEntrypoint) {
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

  log({ level: "debug", message: `reached directory root, using '${path}' as main file` });
  return path;

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
