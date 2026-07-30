import { loadTypeSpecConfigForPath } from "../config/config-loader.js";
import { resolvePackageExports } from "../module-resolver/esm/resolve-package-exports.js";
import { NoMatchingConditionsError } from "../module-resolver/esm/utils.js";
import { fileURLToPath, pathToFileURL } from "../module-resolver/utils.js";
import { doIO, loadFile } from "../utils/io.js";
import { resolveTspMain } from "../utils/misc.js";
import { DiagnosticHandler } from "./diagnostics.js";
import { resolvePath } from "./path-utils.js";
import { CompilerHost } from "./types.js";

/**
 * Resolve the path to the main file
 * @param path path to the entrypoint of the program. Can be the main.tsp, folder containing main.tsp or a project/library root.
 * @returns Absolute path to the entrypoint.
 */
export async function resolveTypeSpecEntrypoint(
  host: CompilerHost,
  path: string,
  reportDiagnostic: DiagnosticHandler,
): Promise<string | undefined> {
  const resolvedPath = resolvePath(path);
  const mainStat = await doIO(host.stat, resolvedPath, reportDiagnostic);
  if (!mainStat) {
    return undefined;
  }

  if (mainStat.isDirectory()) {
    return resolveTypeSpecEntrypointForDir(host, resolvedPath, reportDiagnostic);
  } else {
    return resolvedPath;
  }
}

export async function resolveTypeSpecEntrypointForDir(
  host: CompilerHost,
  dir: string,
  reportDiagnostic: DiagnosticHandler,
): Promise<string> {
  // An explicit entrypoint in the project config takes precedence.
  const config = await loadTypeSpecConfigForPath(host, dir, false, false);
  if (config.kind === "project" && config.entrypoint !== undefined) {
    return resolvePath(dir, config.entrypoint);
  }

  const pkgJsonPath = resolvePath(dir, "package.json");
  const [pkg] = await loadFile(host, pkgJsonPath, JSON.parse, reportDiagnostic, {
    allowFileNotFound: true,
  });

  // Try exports["."]["typespec"] first using the existing ESM package exports resolver.
  if (pkg?.exports) {
    try {
      const match = await resolvePackageExports(
        {
          packageUrl: pathToFileURL(dir),
          specifier: ".",
          moduleDirs: ["node_modules"],
          conditions: ["typespec"],
          ignoreDefaultCondition: true,
          resolveId: () => {
            throw new Error("not supported");
          },
        },
        ".",
        pkg.exports,
      );
      if (match) {
        return fileURLToPath(match);
      }
    } catch (e) {
      if (!(e instanceof NoMatchingConditionsError)) {
        throw e;
      }
      // No matching typespec condition — fall through to tspMain / main.tsp
    }
  }

  // Fall back to the legacy `tspMain` declared in package.json.
  const tspMain = resolveTspMain(pkg);
  if (tspMain !== undefined) {
    return resolvePath(dir, tspMain);
  }

  return resolvePath(dir, "main.tsp");
}
