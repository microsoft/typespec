import { executeCommand } from "./utils.js";

export enum InstallationAction {
  Install = "Install",
  Cancel = "Cancel",
  Upgrade = "Upgrade",
}

export class NpmUtil {
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  public async npmInstallPackages(packages: string[] = [], options: any = {}) {
    let command;
    if (packages.length > 0) {
      command = `npm install ${packages.join(" ")}`;
    } else {
      command = `npm install`;
    }
    await executeCommand(command, [], { ...options, cwd: this.cwd });
  }

  public ensureNpmPackageInstall(
    packageName: string,
    version?: string,
  ): { action: InstallationAction; version: string } {
    const [isPackageInstalled, installedVersion] = this.isPackageInstalled(packageName, version);
    if (isPackageInstalled) {
      if (version && installedVersion !== version) {
        return { action: InstallationAction.Upgrade, version: version };
      }
      return { action: InstallationAction.Cancel, version: installedVersion };
    } else {
      return { action: InstallationAction.Install, version: version ?? "latest" };
    }
  }

  private isPackageInstalled(packageName: string, version?: string): [boolean, string] {
    return [false, "latest"];
  }
}
