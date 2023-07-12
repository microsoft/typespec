import { joinPaths } from "../../path-utils.js";
import { installVsix } from "../install-vsix.js";
import { CliCompilerHost } from "../types.js";
import { run } from "../utils.js";

const VSIX_ALREADY_INSTALLED = 1001;
const VSIX_NOT_INSTALLED = 1002;
const VSIX_USER_CANCELED = 2005;
const VS_SUPPORTED_VERSION_RANGE = "[17.0,)";

export async function installVSExtension(host: CliCompilerHost) {
  const vsixInstaller = getVsixInstallerPath();

  if (!isVSInstalled(host, VS_SUPPORTED_VERSION_RANGE)) {
    // eslint-disable-next-line no-console
    console.error("error: No compatible version of Visual Studio found.");
    process.exit(1);
  }

  await installVsix(host, "typespec-vs", (vsixPaths) => {
    for (const vsix of vsixPaths) {
      // eslint-disable-next-line no-console
      console.log(`Installing extension for Visual Studio...`);
      run(host, vsixInstaller, [vsix], {
        allowedExitCodes: [VSIX_ALREADY_INSTALLED, VSIX_USER_CANCELED],
      });
    }
  });
}

export async function uninstallVSExtension(host: CliCompilerHost) {
  const vsixInstaller = getVsixInstallerPath();
  run(host, vsixInstaller, ["/uninstall:88b9492f-c019-492c-8aeb-f325a7e4cf23"], {
    allowedExitCodes: [VSIX_NOT_INSTALLED, VSIX_USER_CANCELED],
  });
}

function getVsixInstallerPath(): string {
  return getVSInstallerPath(
    "resources/app/ServiceHub/Services/Microsoft.VisualStudio.Setup.Service/VSIXInstaller.exe"
  );
}

function getVSWherePath(): string {
  return getVSInstallerPath("vswhere.exe");
}

function getVSInstallerPath(relativePath: string) {
  if (process.platform !== "win32") {
    // eslint-disable-next-line no-console
    console.error("error: Visual Studio extension is not supported on non-Windows.");
    process.exit(1);
  }

  return joinPaths(
    process.env["ProgramFiles(x86)"] ?? "",
    "Microsoft Visual Studio/Installer",
    relativePath
  );
}

function isVSInstalled(host: CliCompilerHost, versionRange: string) {
  const vswhere = getVSWherePath();
  const proc = run(
    host,
    vswhere,
    ["-property", "instanceid", "-prerelease", "-version", versionRange],
    {
      stdio: [null, "pipe", "inherit"],
      allowNotFound: true,
    }
  );
  return proc.status === 0 && proc.stdout;
}
