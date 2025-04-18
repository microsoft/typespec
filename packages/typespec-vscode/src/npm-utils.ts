import { readFile } from "fs/promises";
import path from "path";
import semver from "semver";
import logger from "./log/logger.js";
import { ExecOutput, loadModule, spawnExecutionAndLogToOutput } from "./utils.js";

export enum InstallAction {
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

  public async npmInstallPackages(packages: string[] = [], options: any = {}): Promise<ExecOutput> {
    return spawnExecutionAndLogToOutput("npm", ["install", ...packages], this.cwd);
  }

  /* identify the action to take for a package. install or skip or cancel or upgrade */
  public async calculateNpmPackageInstallAction(
    packageName: string,
    version?: string,
  ): Promise<{ action: InstallAction; version?: string }> {
    const { installed: isPackageInstalled, version: installedVersion } =
      await this.isPackageInstalled(packageName);
    if (isPackageInstalled) {
      if (version && installedVersion !== version) {
        if (semver.gt(version, installedVersion!)) {
          return { action: InstallAction.Upgrade, version: version };
        } else {
          logger.info(
            "The version to intall is less than the installed version. Skip installation.",
          );
          return { action: InstallAction.Skip, version: installedVersion };
        }
      }
      return { action: InstallAction.Skip, version: installedVersion };
    } else {
      return { action: InstallAction.Install, version: version };
    }
  }

  /* identify the dependency packages need to be upgraded */
  public async calculateNpmPackageDependencyToUpgrade(
    packageName: string,
    version?: string,
    dependencyTypes: npmDependencyType[] = [npmDependencyType.dependencies],
  ): Promise<{ name: string; version: string }[]> {
    const dependenciesToInstall: { name: string; version: string }[] = [];
    let packageFullName = packageName;
    if (version) {
      packageFullName = `${packageName}@${version}`;
    }

    /* get dependencies. */
    if (dependencyTypes.length === 0) {
      logger.info("No dependency to check.");
      return dependenciesToInstall;
    }

    try {
      const dependenciesResult = await spawnExecutionAndLogToOutput(
        "npm",
        ["view", packageFullName, ...dependencyTypes, "--json"],
        this.cwd,
      );

      if (dependenciesResult.exitCode === 0) {
        const json = JSON.parse(dependenciesResult.stdout);
        const jsonDependencies: any[] = [];
        if (dependencyTypes.length > 1) {
          jsonDependencies.push(...Object.values(json));
        } else {
          jsonDependencies.push(json);
        }
        const dependencies = parseDependency(jsonDependencies);
        for (const [key, value] of Object.entries(dependencies)) {
          const { installed, version: installedVersion } = await this.isPackageInstalled(key);
          if (installed && installedVersion) {
            if (!this.isValidVersion(installedVersion, value.join("||"))) {
              dependenciesToInstall.push({ name: key, version: "latest" });
            }
          }
        }
      } else {
        logger.error(`Error getting dependencies for ${packageFullName}.`, [
          dependenciesResult.stderr,
        ]);
      }
    } catch (err) {
      logger.error(`Error getting dependencies for ${packageFullName}.`, [err]);
    }

    function parseDependency(jsonDependencies: any[]): Record<string, string[]> {
      const dependencies: Record<string, string[]> = {};
      for (const dependency of jsonDependencies) {
        for (const [key, value] of Object.entries(dependency)) {
          if (dependencies[key]) {
            dependencies[key].push(value as string);
          } else {
            dependencies[key] = [value as string];
          }
        }
      }
      return dependencies;
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

  public async loadNpmPackage(packageName: string): Promise<NpmPackageInfo | undefined> {
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
