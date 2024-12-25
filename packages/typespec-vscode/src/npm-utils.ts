import { readFile } from "fs/promises";
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

  /* identify the action to take for a package. install or skip or cancel or upgrade */
  public async calculateNpmPackageInstallAction(
    packageName: string,
    version?: string,
  ): Promise<{ action: InstallationAction; version?: string }> {
    const { installed: isPackageInstalled, version: installedVersion } =
      await this.isPackageInstalled(packageName);
    if (isPackageInstalled) {
      if (version && installedVersion !== version) {
        if (semver.gt(version, installedVersion!)) {
          return { action: InstallationAction.Upgrade, version: version };
        } else {
          logger.info(
            "The version to intall is less than the installed version. Skip installation.",
          );
          return { action: InstallationAction.Skip, version: installedVersion };
        }
      }
      return { action: InstallationAction.Skip, version: installedVersion };
    } else {
      return { action: InstallationAction.Install, version: version };
    }
  }

  /* identify the dependency packages need to be upgraded */
  public async calculateNpmPackageDependencyToUpgrade(
    packageName: string,
    version?: string,
    dependencyType: npmDependencyType = npmDependencyType.dependencies,
    on?: spawnExecutionEvents,
  ): Promise<string[]> {
    const dependenciesToInstall: string[] = [];
    let packageFullName = packageName;
    if (version) {
      packageFullName = `${packageName}@${version}`;
    }

    /* get dependencies. */
    try {
      const dependenciesResult = await spawnExecution(
        "npm",
        ["view", packageFullName, dependencyType, "--json"],
        this.cwd,
        on,
      );

      if (dependenciesResult.exitCode === 0) {
        const json = JSON.parse(dependenciesResult.stdout);
        for (const [key, value] of Object.entries(json)) {
          const { installed, version: installedVersion } = await this.isPackageInstalled(key);
          if (installed && installedVersion) {
            if (!this.isValidVersion(installedVersion, value as string)) {
              dependenciesToInstall.push(`${key}@latest`);
            }
          }
        }
      } else {
        logger.error("Error getting dependencies.", [dependenciesResult.stderr]);
      }
    } catch (err) {
      if (on && on.onError) {
        on.onError(err, "", "");
      }
      logger.error("Error getting dependencies.", [err]);
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
        const data = await readFile(packageJsonPath, { encoding: "utf-8" });
        const packageJson = JSON.parse(data);
        version = packageJson.version;
      } catch (error) {
        logger.error("Error reading package.json.", [error]);
      }
      return {
        name: packageName,
        version: version,
      };
    }

    return undefined;
  }
}
