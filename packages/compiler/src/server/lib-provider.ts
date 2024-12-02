import { joinPaths } from "../core/path-utils.js";
import { NpmPackage, NpmPackageProvider } from "./npm-package-provider.js";

export class LibraryProvider {
  private isEmitterPackageCache = new Map<string, boolean>();
  private isLinterPackageCache = new Map<string, boolean>();
  private isGetEmitter: boolean = false;
  constructor(private npmPackageProvider: NpmPackageProvider) {}

  /**
   * Set whether to get the emitter library or the linter library
   * @param isGetEmitter true if you want to get the emitter library, false if you want to get the linter library
   */
  setIsGetEmitterVal(isGetEmitter: boolean): void {
    this.isGetEmitter = isGetEmitter;
  }

  /**
   *
   * @param startFolder folder starts to search for package.json with emitters/linters defined as dependencies
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
   * @param startFolder folder starts to search for package.json with emitters/linter defined as dependencies
   * @param emitterName
   * @returns
   */
  async getLibrary(startFolder: string, emitterName: string): Promise<NpmPackage | undefined> {
    const packageJsonFolder = await this.npmPackageProvider.getPackageJsonFolder(startFolder);
    if (!packageJsonFolder) {
      return undefined;
    }
    return this.getLibraryFromDep(packageJsonFolder, emitterName);
  }

  private async isEmitter(depName: string, pkg: NpmPackage) {
    if (this.isGetEmitter && this.isEmitterPackageCache.has(depName)) {
      return this.isEmitterPackageCache.get(depName);
    }

    if (!this.isGetEmitter && this.isLinterPackageCache.has(depName)) {
      return this.isLinterPackageCache.get(depName);
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
      const isEmitter = this.isGetEmitter
        ? exports.$onEmit !== undefined
        : exports.$linter !== undefined;
      if (this.isGetEmitter) {
        this.isEmitterPackageCache.set(depName, isEmitter);
      } else {
        this.isLinterPackageCache.set(depName, isEmitter);
      }
      return isEmitter;
    } else {
      if (this.isGetEmitter) {
        this.isEmitterPackageCache.set(depName, false);
      } else {
        this.isLinterPackageCache.set(depName, false);
      }

      return false;
    }
  }

  private async getLibraryFromDep(packageJsonFolder: string, depName: string) {
    const depFolder = joinPaths(packageJsonFolder, "node_modules", depName);
    const depPkg = await this.npmPackageProvider.get(depFolder);
    if (depPkg && (await this.isEmitter(depName, depPkg))) {
      return depPkg;
    }
    return undefined;
  }
}
