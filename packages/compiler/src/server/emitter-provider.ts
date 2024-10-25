import { joinPaths } from "../core/path-utils.js";
import { NpmPackage, NpmPackageProvider } from "./npm-package-provider.js";

export class EmitterProvider {
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

  private static async isEmitter(pkg: NpmPackage) {
    const data = await pkg.getPackageJsonData();
    if (!data) return false;
    if (
      (data.devDependencies && data.devDependencies["@typespec/compiler"]) ||
      (data.dependencies && data.dependencies["@typespec/compiler"])
    ) {
      const exports = await pkg.getModuleExports();
      return exports && exports.$onEmit;
    }
    return false;
  }

  private async getEmitterFromDep(packageJsonFolder: string, depName: string) {
    const depFolder = joinPaths(packageJsonFolder, "node_modules", depName);
    const depPkg = await this.npmPackageProvider.get(depFolder);
    if (depPkg && (await EmitterProvider.isEmitter(depPkg))) {
      return depPkg;
    }
    return undefined;
  }
}
