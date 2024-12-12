import fs from "fs";
import path from "path";
import logger from "./log/logger.js";
import { ExecOutput, executionEvents, loadModule, promisifySpawn } from "./utils.js";

export enum InstallationAction {
  Install = "Install",
  Upgrade = "Upgrade",
  Skip = "Skip",
  Cancel = "Cancel",
}

export interface NpmPackageInfo {
  name: string;
  version?: string;
  resolved?: string;
  overridden?: string;
  dependencies?: Record<string, NpmPackageInfo>;
}

export class NpmUtil {
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  public async npmInstallPackages(
    packages: string[] = [],
    options: any = {},
    on?: executionEvents,
  ): Promise<ExecOutput> {
    return promisifySpawn("npm", ["install", ...packages], { cwd: this.cwd }, on);
  }

  public async ensureNpmPackageInstall(
    packageName: string,
    version?: string,
  ): Promise<{ action: InstallationAction; version: string }> {
    const { installed: isPackageInstalled, version: installedVersion } =
      await this.isPackageInstalled(packageName);
    if (isPackageInstalled) {
      if (version && installedVersion !== version) {
        return { action: InstallationAction.Upgrade, version: version };
      }
      return { action: InstallationAction.Cancel, version: installedVersion ?? "" };
    } else {
      return { action: InstallationAction.Install, version: version ?? "" };
    }
  }

  private async isPackageInstalled(
    packageName: string,
  ): Promise<{ installed: boolean; version: string | undefined }> {
    const packageInfo = await this.loadNpmPackage(packageName);
    if (packageInfo) return { installed: true, version: packageInfo.version };
    return { installed: false, version: undefined };
  }

  private async loadNpmPackage(packageName: string): Promise<NpmPackageInfo | undefined> {
    const executable = await loadModule(this.cwd, packageName);
    if (executable) {
      const packageJsonPath = path.resolve(executable.path, "package.json");

      /* get the package version. */
      let version;
      try {
        const data = fs.readFileSync(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(data);
        version = packageJson.version;
      } catch (error) {
        logger.error(`Error reading package.json: ${error}`);
      }
      return {
        name: packageName,
        version: version,
      };
    }

    return undefined;
  }
}
