import { glob, readFile, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import stripJsonComments from "strip-json-comments";
import { parse as parseYaml } from "yaml";

export interface WorkspacePackageManifest {
  name?: string;
  version?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface WorkspacePackage {
  /** Parsed `package.json` content. */
  manifest: WorkspacePackageManifest;
  /** Path to the package directory relative to the workspace root, e.g. `packages/compiler`. */
  rootDir: string;
  /** Absolute, symlink-resolved path to the package directory. */
  rootDirRealPath: string;
}

/**
 * Lightweight in-house replacement for `@pnpm/workspace.find-packages`'s
 * `findWorkspacePackagesNoCheck`.
 *
 * Reads the `pnpm-workspace.yaml` at the workspace root, expands its `packages`
 * globs (honoring `!`-prefixed negative patterns), and reads each discovered
 * `package.json`. No filtering of private/unnamed packages is done here to keep
 * parity with the `NoCheck` semantics; callers apply their own filtering.
 *
 * @param workspaceRoot - Root directory of the PNPM workspace.
 * @returns Discovered packages with their manifest and directory paths.
 */
export async function findWorkspacePackages(workspaceRoot: string): Promise<WorkspacePackage[]> {
  const patterns = await readWorkspacePatterns(workspaceRoot);

  const include: string[] = [];
  const exclude: string[] = [];
  for (const pattern of patterns) {
    if (pattern.startsWith("!")) {
      exclude.push(pattern.slice(1));
    } else {
      // pnpm treats each entry as a package directory; look for its manifest.
      include.push(`${pattern}/package.json`);
    }
  }

  if (include.length === 0) {
    return [];
  }

  const packages: WorkspacePackage[] = [];
  for await (const match of glob(include, { cwd: workspaceRoot, exclude })) {
    const rootDir = dirname(match);
    const manifestPath = join(workspaceRoot, match);
    const manifest = await readJsonFile<WorkspacePackageManifest>(manifestPath);
    packages.push({
      manifest,
      rootDir,
      rootDirRealPath: await realpath(resolve(workspaceRoot, rootDir)),
    });
  }

  return packages;
}

async function readWorkspacePatterns(workspaceRoot: string): Promise<string[]> {
  const content = await readFile(join(workspaceRoot, "pnpm-workspace.yaml"), "utf-8");
  const config = parseYaml(content) as { packages?: string[] } | undefined;
  return config?.packages ?? [];
}

async function readJsonFile<T>(filename: string): Promise<T> {
  const content = await readFile(filename, "utf-8");
  return JSON.parse(stripJsonComments(content));
}
