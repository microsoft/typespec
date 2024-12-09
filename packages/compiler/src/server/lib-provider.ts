import { joinPaths } from "../core/path-utils.js";
import { NpmPackage, NpmPackageProvider } from "./npm-package-provider.js";

export class LibraryProvider {
  private isLibPackageCache = new Map<string, boolean>();
  constructor(
    private libPackageFilterResultCache: NpmPackageProvider,
    private filter: (obj: Record<string, any>) => boolean,
  ) {}

  /**
   *
   * @param startFolder folder starts to search for package.json with library defined as dependencies
   * @returns
   */
  async listLibraries(startFolder: string): Promise<Record<string, NpmPackage>> {
    const packageJsonFolder =
      await this.libPackageFilterResultCache.getPackageJsonFolder(startFolder);
    if (!packageJsonFolder) return {};

    const pkg = await this.libPackageFilterResultCache.get(packageJsonFolder);
    const data = await pkg?.getPackageJsonData();
    if (!data) return {};

    const libs: Record<string, NpmPackage> = {};
    const allDep = {
      ...(data.dependencies ?? {}),
      ...(data.devDependencies ?? {}),
    };
    for (const dep of Object.keys(allDep)) {
      const depPkg = await this.getLibraryFromDep(packageJsonFolder, dep);
      if (depPkg) {
        libs[dep] = depPkg;
      }
    }
    return libs;
  }

  /**
   *
   * @param startFolder folder starts to search for package.json with library defined as dependencies
   * @param libName
   * @returns
   */
  async getLibrary(startFolder: string, libName: string): Promise<NpmPackage | undefined> {
    const packageJsonFolder =
      await this.libPackageFilterResultCache.getPackageJsonFolder(startFolder);
    if (!packageJsonFolder) {
      return undefined;
    }
    return this.getLibraryFromDep(packageJsonFolder, libName);
  }

  private async getLibFilterResult(depName: string, pkg: NpmPackage) {
    if (this.isLibPackageCache.has(depName)) {
      return this.isLibPackageCache.get(depName);
    }

    const data = await pkg.getPackageJsonData();
    // don't add to cache when failing to load package.json which is unexpected
    if (!data) return false;
    if (
      (data.devDependencies && data.devDependencies["@typespec/compiler"]) ||
      (data.dependencies && data.dependencies["@typespec/compiler"])
    ) {
      const exports = await pkg.getModuleExports();
      // don't add to cache when failing to load exports which is unexpected
      if (!exports) return false;

      const isEmitter = this.filter(exports);
      this.isLibPackageCache.set(depName, isEmitter);
      return isEmitter;
    } else {
      this.isLibPackageCache.set(depName, false);
      return false;
    }
  }

  private async getLibraryFromDep(packageJsonFolder: string, depName: string) {
    const depFolder = joinPaths(packageJsonFolder, "node_modules", depName);
    const depPkg = await this.libPackageFilterResultCache.get(depFolder);
    if (depPkg && (await this.getLibFilterResult(depName, depPkg))) {
      return depPkg;
    }
    return undefined;
  }
}
