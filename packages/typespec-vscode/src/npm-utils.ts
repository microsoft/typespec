import { NodePackage } from "@typespec/compiler";
import { joinPaths } from "./path-utils.js";
import { isFile, listParentFolders, tryParseJson, tryReadFile } from "./utils.js";

/**
 *
 * @param folder the folder (inclusive) to start searching (up) for package.json
 * @returns
 */
export async function searchAndLoadPackageJson(
  folder: string,
): Promise<{ packageJsonFolder?: string; packageJsonFile?: string; packageJson?: NodePackage }> {
  for (const f of listParentFolders(folder, true /* include self */)) {
    const path = joinPaths(f, "package.json");
    if (await isFile(path)) {
      const json = await tryLoadPackageJsonFile(path);
      if (json) {
        return { packageJsonFolder: f, packageJsonFile: path, packageJson: json };
      } else {
        return { packageJsonFolder: undefined, packageJsonFile: undefined, packageJson: undefined };
      }
    }
  }
  return { packageJsonFolder: undefined, packageJsonFile: undefined, packageJson: undefined };
}

/**
 *
 * @param rootPackageJsonFolder the folder containing package.json.
 * @param depPackageName
 * @returns
 */
export async function loadDependencyPackageJson(
  rootPackageJsonFolder: string,
  depPackageName: string,
): Promise<NodePackage | undefined> {
  const path = joinPaths(rootPackageJsonFolder, "node_modules", depPackageName, "package.json");
  if (!(await isFile(path))) {
    return undefined;
  }
  return await tryLoadPackageJsonFile(path);
}

/**
 *
 * @param packageJsonPath the path to the package.json file. Please be aware that it's the caller's responsibility to ensure the path given is package.json, no further check will be done.
 * @returns
 */
async function tryLoadPackageJsonFile(packageJsonPath: string): Promise<NodePackage | undefined> {
  const content = await tryReadFile(packageJsonPath);
  if (!content) return undefined;
  const packageJson = tryParseJson(content);
  if (!packageJson) return undefined;
  return packageJson as NodePackage;
}
