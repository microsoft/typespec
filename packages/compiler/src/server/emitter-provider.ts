import { joinPaths } from "../core/path-utils.js";
import { NpmPackage, NpmPackageProvider } from "./npm-package-provider.js";

export class EmitterProvider {
  private isEmitterPackageCache = new Map<string, boolean>();
  constructor(private npmPackageProvider: NpmPackageProvider) {}

  /**
   *
   * @param startFolder folder starts to search for package.json with emitters defined as dependencies
   * @returns
   */
  async listEmitters(startFolder: string): Promise<Record<string, NpmPackage>> {
    const packageJsonFolder = await this.npmPackageProvider.getPackageJsonFolder(startFolder);
    if (!packageJsonFolder) return {};

    const pkg = await this.npmPackageProvider.get(packageJsonFolder);
    const data = await pkg?.getPackageJsonData();
    if (!data) return {};

    const emitters: Record<string, NpmPackage> = {};
    const allDep = {
      ...(data.dependencies ?? {}),
      ...(data.devDependencies ?? {}),
    };
    for (const dep of Object.keys(allDep)) {
      const depPkg = await this.getEmitterFromDep(packageJsonFolder, dep);
      if (depPkg) {
        emitters[dep] = depPkg;
      }
    }
    return emitters;
  }

  /**
   *
   * @param startFolder folder starts to search for package.json with emitters defined as dependencies
   * @param emitterName
   * @returns
   */
  async getEmitter(startFolder: string, emitterName: string): Promise<NpmPackage | undefined> {
    const packageJsonFolder = await this.npmPackageProvider.getPackageJsonFolder(startFolder);
    if (!packageJsonFolder) {
      return undefined;
    }
    return this.getEmitterFromDep(packageJsonFolder, emitterName);
  }

  private async isEmitter(depName: string, pkg: NpmPackage) {
    if (this.isEmitterPackageCache.has(depName)) {
      return this.isEmitterPackageCache.get(depName);
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
      const isEmitter = exports.$onEmit !== undefined;
      this.isEmitterPackageCache.set(depName, isEmitter);
      return isEmitter;
    } else {
      this.isEmitterPackageCache.set(depName, false);
      return false;
    }
  }

  private async getEmitterFromDep(packageJsonFolder: string, depName: string) {
    const depFolder = joinPaths(packageJsonFolder, "node_modules", depName);
    const depPkg = await this.npmPackageProvider.get(depFolder);
    if (depPkg && (await this.isEmitter(depName, depPkg))) {
      return depPkg;
    }
    return undefined;
  }
}
