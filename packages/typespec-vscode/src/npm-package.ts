import { NodePackage } from "@typespec/compiler";
import { FSWatcher, watch, WatchEventType, WatchListener } from "fs";
import { join } from "path";
import { debounce, loadModuleExports, loadNpmPackage, normalizeSlash } from "./utils.js";

export class NpmPackageProvider {
  private cache = new Map<string, NpmPackage>();

  public async get(packageFolder: string): Promise<NpmPackage | undefined> {
    const key = this.getCacheKey(packageFolder);
    const r = this.cache.get(key);
    if (r) {
      return r;
    } else {
      const pkg = await NpmPackage.createFrom(packageFolder);
      if (pkg) {
        this.cache.set(key, pkg);
        return pkg;
      } else {
        return undefined;
      }
    }
  }

  private getCacheKey(packageFolder: string) {
    return normalizeSlash(packageFolder);
  }

  private clearCache() {
    const t = this.cache;
    this.cache = new Map();
    t.forEach((pkg) => {
      pkg.dispose();
    });
  }

  public dispose() {
    this.clearCache();
  }
}

export class NpmPackage {
  private constructor(packageFolder: string, packageJsonData: NodePackage | undefined) {
    this.packageFolder = packageFolder;
    this._packageJsonData = packageJsonData;

    const onPackageJsonChange: WatchListener<string> = debounce(
      (eventType: WatchEventType, filename: string | null) => {
        this.clearCache();
      },
      200,
    );
    this.packageJsonWatcher = watch(
      this.packageJsonFile,
      { encoding: "utf-8", persistent: false, recursive: false },
      onPackageJsonChange,
    );
  }

  private packageFolder: string;
  private packageJsonWatcher: FSWatcher | undefined;

  get packageJsonFile(): string {
    return join(this.packageFolder, "package.json");
  }

  private _packageJsonData: NodePackage | undefined;
  async getPackageJsonData(): Promise<NodePackage | undefined> {
    if (!this._packageJsonData) {
      this._packageJsonData = await loadNpmPackage(this.packageFolder);
    }
    return this._packageJsonData;
  }

  private _packageModule: Record<string, any> | undefined;
  async getModuleExports(): Promise<Record<string, any> | undefined> {
    if (!this._packageModule) {
      const data = await this.getPackageJsonData();
      if (!data) return undefined;
      this._packageModule = await loadModuleExports(this.packageFolder, data.name);
    }
    return this._packageModule;
  }

  private clearCache() {
    this._packageJsonData = undefined;
    this._packageModule = undefined;
  }

  dispose() {
    if (this.packageJsonWatcher) {
      this.packageJsonWatcher.close();
    }
  }

  /**
   *
   * @param baseDir the dir containing the package.json file
   * @returns
   */
  public static async createFrom(packageFolder: string): Promise<NpmPackage | undefined> {
    if (!packageFolder) {
      throw new Error("baseDir is required");
    }
    const data = await loadNpmPackage(packageFolder);
    if (!data) {
      return undefined;
    }
    return new NpmPackage(packageFolder, data);
  }
}

const npmPackageProvider = new NpmPackageProvider();
export default npmPackageProvider;
