import { joinPaths } from "../core/path-utils.js";
import { NpmPackage, NpmPackageProvider } from "./npm-package-provider.js";

export class LibraryProvider {
  private libPackageFilterResultCache = new Map<string, boolean>();
  constructor(
    private npmPackageProvider: NpmPackageProvider,
    private filter: (libExports: Record<string, any>) => boolean,
  ) {}

  /**
   *
   * @param startFolder folder starts to search for package.json with library defined as dependencies
   * @returns
   */
  async listLibraries(startFolder: string): Promise<Record<string, NpmPackage>> {
    const packageJsonFolder = await this.npmPackageProvider.getPackageJsonFolder(startFolder);
    if (!packageJsonFolder) return {};

    const pkg = await this.npmPackageProvider.get(packageJsonFolder);
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
    const packageJsonFolder = await this.npmPackageProvider.getPackageJsonFolder(startFolder);
    if (!packageJsonFolder) {
      return undefined;
    }
    return this.getLibraryFromDep(packageJsonFolder, libName);
  }

  private async getLibFilterResult(depName: string, pkg: NpmPackage) {
    if (this.libPackageFilterResultCache.has(depName)) {
      return this.libPackageFilterResultCache.get(depName);
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

      const filterResult = this.filter(exports);
      this.libPackageFilterResultCache.set(depName, filterResult);
      return filterResult;
    } else {
      this.libPackageFilterResultCache.set(depName, false);
      return false;
    }
  }

  private async getLibraryFromDep(packageJsonFolder: string, depName: string) {
    const depFolder = joinPaths(packageJsonFolder, "node_modules", depName);
    const depPkg = await this.npmPackageProvider.get(depFolder);
    if (depPkg && (await this.getLibFilterResult(depName, depPkg))) {
      return depPkg;
    }
    return undefined;
  }
}
