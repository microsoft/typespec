import fs from "fs";
import path from "path";
import semver from "semver";
import logger from "./log/logger.js";
import { ExecOutput, loadModule, spawnExecution, spawnExecutionEvents } from "./utils.js";

export enum InstallationAction {
  Install = "Install",
  Upgrade = "Upgrade",
  Skip = "Skip",
  Cancel = "Cancel",
}

export enum npmDependencyType {
  dependencies = "dependencies",
  peerDependencies = "peerDependencies",
  devDependencies = "devDependencies",
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
    on?: spawnExecutionEvents,
  ): Promise<ExecOutput> {
    return spawnExecution("npm", ["install", ...packages], this.cwd, on);
  }

  public async ensureNpmPackageInstall(
    packageName: string,
    version?: string,
  ): Promise<{ action: InstallationAction; version?: string }> {
    const { installed: isPackageInstalled, version: installedVersion } =
      await this.isPackageInstalled(packageName);
    if (isPackageInstalled) {
      if (version && installedVersion !== version) {
        return {
          action: InstallationAction.Upgrade,
          version: version,
        };
      }
      return { action: InstallationAction.Skip, version: installedVersion };
    } else {
      return { action: InstallationAction.Install, version: version };
    }
  }

  public async ensureNpmPackageDependencyInstall(
    packageName: string,
    version?: string,
    dependencyType: npmDependencyType = npmDependencyType.dependencies,
    options: any = {},
    on?: spawnExecutionEvents,
  ): Promise<string[]> {
    const dependenciesToInstall: string[] = [];
    let packageFullName = packageName;
    if (version) {
      packageFullName = `${packageName}@${version}`;
    }

    /* get dependencies. */
    const dependenciesResult = await spawnExecution(
      "npm",
      ["view", packageFullName, dependencyType],
      this.cwd,
      on,
    );

    if (dependenciesResult.exitCode === 0) {
      try {
        // Remove all newline characters
        let dependenciesJsonStr = dependenciesResult.stdout.trim();
        dependenciesJsonStr = dependenciesJsonStr.replace(/\n/g, "");

        // Change single quotes to double quotes
        dependenciesJsonStr = dependenciesJsonStr.replace(/'/g, '"');
        const json = JSON.parse(dependenciesJsonStr);
        for (const [key, value] of Object.entries(json)) {
          const { installed, version: installedVersion } = await this.isPackageInstalled(key);
          if (installed && installedVersion) {
            if (!this.isValidVersion(installedVersion, value as string)) {
              dependenciesToInstall.push(`${key}@latest`);
            }
          }
        }
      } catch (err) {
        if (on && on.onError) {
          on.onError(err, "", "");
        }
      }
    }

    return dependenciesToInstall;
  }

  private isValidVersion(version: string, range: string): boolean {
    return semver.satisfies(version, range);
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
