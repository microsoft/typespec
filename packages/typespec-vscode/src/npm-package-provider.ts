import type { NodePackage } from "@typespec/compiler";
import { FSWatcher, watch, WatchEventType, WatchListener } from "fs";
import { join } from "path";
import {
  debounce,
  forCurAndParentDirectories,
  isFile,
  isWhitespaceString,
  loadModuleExports,
  loadNodePackage,
  normalizeSlash,
} from "./utils.js";

export class NpmPackageProvider {
  private pkgCache = new Map<string, NpmPackage>();
  private packageJsonFolderCache = new Map<string, string>();

  /**
   * Search for the nearest package.json file starting from the given folder to its parent/grandparent/... folders
   * @param startFolder the folder to start searching for package.json file
   * @returns
   */
  async getPackageJsonFolder(startFolder: string): Promise<string | undefined> {
    if (isWhitespaceString(startFolder)) {
      return undefined;
    }
    const cache = this.packageJsonFolderCache.get(startFolder);
    if (cache) {
      return cache;
    }
    return await forCurAndParentDirectories(startFolder, async (dir: string) => {
      const packageJsonPath = join(dir, "package.json");
      if (await isFile(packageJsonPath)) {
        this.packageJsonFolderCache.set(startFolder, dir);
        return dir;
      }
      return undefined;
    });
  }

  /**
   * Get the NpmPackage instance from the folder containing the package.json file.
   *
   * @param packageJsonFolder the dir containing the package.json file. This method won't search for the package.json file, use getPackageJsonFolder to search for the folder containing the package.json file if needed.
   * @returns the NpmPackage instance or undefined if no proper package.json file found
   */
  public async get(packageJsonFolder: string): Promise<NpmPackage | undefined> {
    const key = this.getCacheKey(packageJsonFolder);
    const r = this.pkgCache.get(key);
    if (r) {
      return r;
    } else {
      const pkg = await NpmPackage.createFrom(packageJsonFolder);
      if (pkg) {
        this.pkgCache.set(key, pkg);
        return pkg;
      } else {
        return undefined;
      }
    }
  }

  private getCacheKey(packageJsonFolder: string) {
    return normalizeSlash(packageJsonFolder);
  }

  private clearCache() {
    this.packageJsonFolderCache = new Map();
    const t = this.pkgCache;
    this.pkgCache = new Map();
    t.forEach((pkg) => {
      pkg.dispose();
    });
  }

  /**
   * reset the status of the provider with all the caches properly cleaned up
   */
  public reset() {
    this.clearCache();
  }
}

export class NpmPackage {
  private constructor(packageJsonFolder: string, packageJsonData: NodePackage | undefined) {
    this.packageJsonFolder = packageJsonFolder;
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

  private packageJsonFolder: string;
  private packageJsonWatcher: FSWatcher | undefined;

  get packageJsonFile(): string {
    return join(this.packageJsonFolder, "package.json");
  }

  private _packageJsonData: NodePackage | undefined;
  async getPackageJsonData(): Promise<NodePackage | undefined> {
    if (!this._packageJsonData) {
      this._packageJsonData = await loadNodePackage(this.packageJsonFolder);
    }
    return this._packageJsonData;
  }

  private _packageModule: Record<string, any> | undefined;
  async getModuleExports(): Promise<Record<string, any> | undefined> {
    if (!this._packageModule) {
      const data = await this.getPackageJsonData();
      if (!data) return undefined;
      this._packageModule = await loadModuleExports(this.packageJsonFolder, data.name);
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
   * Create a NpmPackage instance from a folder containing a package.json file. Make sure to dispose the instance when you finish using it.
   * @param packageJsonFolder the folder containing the package.json file
   * @returns
   */
  public static async createFrom(packageJsonFolder: string): Promise<NpmPackage | undefined> {
    if (!packageJsonFolder) {
      throw new Error("packageJsonFolder is required");
    }
    const data = await loadNodePackage(packageJsonFolder);
    if (!data) {
      return undefined;
    }
    return new NpmPackage(packageJsonFolder, data);
  }
}

const npmPackageProvider = new NpmPackageProvider();
export default npmPackageProvider;
