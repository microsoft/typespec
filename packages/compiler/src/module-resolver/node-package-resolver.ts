import { joinPaths, resolvePath } from "../core/path-utils.js";
import { NodePackage, ResolveModuleHost } from "./types.js";
import { isFile, listDirHierarchy, readPackage } from "./utils.js";

/**
 * Utility to resolve node packages.
 */
export class NodePackageResolver {
  #host: ResolveModuleHost;

  constructor(host: ResolveModuleHost) {
    this.#host = host;
  }

  /**
   * Resolve a node package with the given specifier from the baseDir.
   * @param specifier Node package specifier
   * @returns NodePackage if found or undefined otherwise
   */
  async resolve(specifier: string, baseDir: string): Promise<NodePackage | undefined> {
    return (
      (await this.resolveSelf(specifier, baseDir)) ??
      (await this.resolveFromNodeModules(specifier, baseDir))
    );
  }

  /**
   * Resolve the NodePackage for the given specifier
   * Implementation from LOAD_PACKAGE_SELF minus the exports resolution which is called separately.
   */
  async resolveSelf(packageName: string, baseDir: string): Promise<NodePackage | undefined> {
    for (const dir of listDirHierarchy(baseDir)) {
      const pkgFile = resolvePath(dir, "package.json");
      if (!(await isFile(this.#host, pkgFile))) continue;
      const pkg = await readPackage(this.#host, pkgFile);
      if (pkg.name === packageName) {
        return pkg;
      } else {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Resolve a node package from `node_modules`. Follows the implementation of LOAD_NODE_MODULES minus following the exports field.
   */
  async resolveFromNodeModules(
    packageName: string,
    baseDir: string,
  ): Promise<NodePackage | undefined> {
    const dirs = listDirHierarchy(baseDir);

    for (const dir of dirs) {
      const path = joinPaths(dir, "node_modules", packageName);
      const pkgFile = resolvePath(path, "package.json");

      if (await isFile(this.#host, pkgFile)) {
        const pkg = await readPackage(this.#host, pkgFile);
        if (pkg) return pkg;
      }
    }
    return undefined;
  }
}
