import { createDiagnosticCollector } from "../../diagnostics.js";
import { createDiagnostic } from "../../messages.js";
import { joinPaths } from "../../path-utils.js";
import { Diagnostic, NoTarget } from "../../types.js";
import { downloadVsixFromMarketplace } from "../download-vsix.js";
import { CliCompilerHost } from "../types.js";
import { reportDeprecatedCommand, run } from "../utils.js";

const VSIX_ALREADY_INSTALLED = 1001;
const VSIX_NOT_INSTALLED = 1002;
const VSIX_USER_CANCELED = 2005;
const VS_SUPPORTED_VERSION_RANGE = "[17.0,)";

/** Marketplace identity of the TypeSpec Visual Studio extension. */
const VS_EXTENSION = {
  publisher: "typespec",
  name: "typespecvs",
  id: "typespec.typespecvs",
} as const;

/** Documentation page describing how to install/manage the Visual Studio extension. */
const VS_DOCS_URL = "https://typespec.io/docs/introduction/editor/vs";

export async function installVSExtension(host: CliCompilerHost): Promise<readonly Diagnostic[]> {
  reportDeprecatedCommand(host, "tsp vs install", VS_DOCS_URL);
  const diagnostics = createDiagnosticCollector();
  const vsixInstaller = diagnostics.pipe(getVsixInstallerPath());
  if (vsixInstaller === undefined) {
    return diagnostics.diagnostics;
  }

  if (!isVSInstalled(host, VS_SUPPORTED_VERSION_RANGE)) {
    return [
      createDiagnostic({
        code: "no-compatible-vs-installed",
        target: NoTarget,
      }),
    ];
  }

  const downloadDiagnostics = await downloadVsixFromMarketplace(host, VS_EXTENSION, (vsix) => {
    // eslint-disable-next-line no-console
    console.log(`Installing extension for Visual Studio...`);
    run(host, vsixInstaller, [vsix], {
      allowedExitCodes: [VSIX_ALREADY_INSTALLED, VSIX_USER_CANCELED],
    });
  });
  for (const diagnostic of downloadDiagnostics) {
    diagnostics.add(diagnostic);
  }

  return diagnostics.diagnostics;
}

export async function uninstallVSExtension(host: CliCompilerHost): Promise<readonly Diagnostic[]> {
  reportDeprecatedCommand(host, "tsp vs uninstall", VS_DOCS_URL);
  const [vsixInstaller, diagnostics] = getVsixInstallerPath();
  if (vsixInstaller === undefined) {
    return diagnostics;
  }
  run(host, vsixInstaller, ["/uninstall:88b9492f-c019-492c-8aeb-f325a7e4cf23"], {
    allowedExitCodes: [VSIX_NOT_INSTALLED, VSIX_USER_CANCELED],
  });
  return diagnostics;
}

function getVsixInstallerPath(): [string | undefined, readonly Diagnostic[]] {
  return getVSInstallerPath(
    "resources/app/ServiceHub/Services/Microsoft.VisualStudio.Setup.Service/VSIXInstaller.exe",
  );
}

function getVSWherePath(): [string | undefined, readonly Diagnostic[]] {
  return getVSInstallerPath("vswhere.exe");
}

function getVSInstallerPath(relativePath: string): [string | undefined, readonly Diagnostic[]] {
  if (process.platform !== "win32") {
    return [undefined, [createDiagnostic({ code: "vs-extension-windows-only", target: NoTarget })]];
  }

  return [
    joinPaths(
      process.env["ProgramFiles(x86)"] ?? "",
      "Microsoft Visual Studio/Installer",
      relativePath,
    ),
    [],
  ];
}

function isVSInstalled(host: CliCompilerHost, versionRange: string) {
  const [vswhere] = getVSWherePath();
  if (vswhere === undefined) {
    return false;
  }
  const proc = run(
    host,
    vswhere,
    ["-property", "instanceid", "-prerelease", "-version", versionRange],
    {
      stdio: [null, "pipe", "inherit"],
      allowNotFound: true,
    },
  );
  return proc.status === 0 && proc.stdout;
}
