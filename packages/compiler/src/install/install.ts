import { fork } from "child_process";
import envPaths from "env-paths";
import { mkdir, rename, rm } from "fs/promises";
import type { CliCompilerHost } from "../core/cli/types.js";
import { DiagnosticError } from "../core/diagnostic-error.js";
import { createDiagnosticCollector } from "../core/diagnostics.js";
import { createTracer } from "../core/logger/tracer.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import { NoTarget, type Diagnostic, type Tracer } from "../core/types.js";
import {
  downloadAndExtractPackage,
  fetchPackageManifest,
  NpmManifest,
} from "../package-manger/npm-registry-utils.js";
import { mkTempDir } from "../utils/fs-utils.js";
import {
  getPackageManagerConfig,
  SupportedPackageManager,
  type PackageManagerConfig,
} from "./config.js";
import {
  Descriptor,
  resolvePackageManagerSpec,
  updatePackageManagerInPackageJson,
  type ResolvedSpecResult,
} from "./spec.js";

interface SpawnError {
  errno: number;
  code: "ENOENT";
  sysCall: string;
  path: string;
  spawnArgs: string[];
}

const paths = envPaths("typespec", { suffix: "" });
const pmDir = joinPaths(paths.cache, "pm");

export class InstallDependenciesError extends DiagnosticError {
  constructor(message: string) {
    super({
      code: "install-package-manager-error",
      message,
      severity: "error",
      target: NoTarget,
    });
  }
}

export interface InstallTypeSpecDependenciesOptions {
  readonly directory: string;
  readonly stdio?: "inherit" | "pipe";
  /** When set to true update the packageManager field with the package manger version and hash */
  readonly savePackageManager?: boolean;
}

async function resolvePackageManagerSpecOrFail(
  host: CliCompilerHost,
  tracer: Tracer,
  options: InstallTypeSpecDependenciesOptions,
): Promise<[ResolvedSpecResult, readonly Diagnostic[]]> {
  const result = await resolvePackageManagerSpec(host, tracer, options.directory);

  switch (result.kind) {
    case "no-package":
      throw new InstallDependenciesError("No package.json found, cannot install dependencies.");
    case "no-spec":
      return [
        {
          kind: "resolved",
          spec: {
            name: "npm",
            range: "latest",
          },
          path: result.path,
        },
        options.savePackageManager
          ? [
              {
                code: "no-package-manager-spec",
                severity: "warning",
                message:
                  "No package manager spec found, defaulted to npm latest version. Please set devEngines.packageManager or packageManager in your package.json.",
                target: NoTarget,
              },
            ]
          : [],
      ];
    case "resolved":
      return [result, []];
  }
}

async function installPackageManager(
  host: CliCompilerHost,
  tracer: Tracer,
  packageManager: SupportedPackageManager,
  spec: Descriptor,
  installDir: string,
  manifest: NpmManifest,
) {
  await rm(installDir, { recursive: true, force: true });
  const tempDir = await mkTempDir(host, pmDir, `tsp-pm-${packageManager}-${manifest.version}`);

  tracer.trace(
    "downloading-extracting",
    `Downloading and extracting ${packageManager} at version ${manifest.version} in ${tempDir}`,
  );
  const extractResult = await downloadAndExtractPackage(manifest, tempDir, spec.hash?.algorithm);
  if (spec.hash) {
    if (spec.hash.value !== extractResult.hash.value) {
      throw new InstallDependenciesError(
        `Mismatch hash for package manager. (${spec.hash.algorithm})\n  Expected: ${spec.hash.value}\n  Actual:   ${extractResult.hash}`,
      );
    }
  }
  await mkdir(getDirectoryPath(installDir), { recursive: true });
  tracer.trace(
    "move-temp-to-install",
    `Move temporary directory ${tempDir} to install directory ${installDir}`,
  );

  await renameSafe(tempDir, installDir);
  tracer.trace("downloaded", `Downloaded and extracted at ${installDir}`);
  return extractResult;
}

async function renameSafe(oldPath: string, newPath: string) {
  if (process.platform === `win32`) {
    await renameSafeWindows(oldPath, newPath);
  } else {
    await rename(oldPath, newPath);
  }
}

// https://github.com/nodejs/corepack/blob/19e3c6861a8affdfd94d97edf495c21e591fe4e0/sources/corepackUtils.ts#L353-L375
async function renameSafeWindows(oldPath: string, newPath: string) {
  // Windows malicious file analysis blocks files currently under analysis
  const retries = 5;
  for (let i = 0; i < retries; i++) {
    try {
      await rename(oldPath, newPath);
      break;
    } catch (error) {
      if (
        ((error as any).code === `ENOENT` || (error as any).code === `EPERM`) &&
        i < retries - 1
      ) {
        await delay(100 * 2 ** i);
        continue;
      } else {
        throw error;
      }
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function installTypeSpecDependencies(
  host: CliCompilerHost,
  options: InstallTypeSpecDependenciesOptions,
): Promise<readonly Diagnostic[]> {
  const { directory, stdio = "inherit", savePackageManager } = options;
  const diagnostics = createDiagnosticCollector();
  const tracer = createTracer(host.logger).sub("install");
  try {
    const { spec, path: packageJsonPath } = diagnostics.pipe(
      await resolvePackageManagerSpecOrFail(host, tracer, options),
    );
    const packageManager = spec.name;
    const packageManagerConfig = getPackageManagerConfig(packageManager);
    const manifest = await fetchPackageManifest(packageManager, spec.range);
    tracer.trace(
      "fetched-manifest",
      `Resolved manifest for ${packageManager} at version ${manifest.version}`,
    );

    const installDir = joinPaths(pmDir, packageManager, manifest.version);
    if ((await isDirectory(host, installDir)) && !savePackageManager) {
      tracer.trace("reusing", `Reusing cached package manager in ${installDir}`);
    } else {
      const extractResult = await installPackageManager(
        host,
        tracer,
        packageManager,
        spec,
        installDir,
        manifest,
      );
      if (savePackageManager) {
        await updatePackageManagerInPackageJson(host, packageJsonPath, {
          name: spec.name,
          range: manifest.version,
          hash: extractResult.hash,
        });
      }
    }

    const bin = manifest.bin![packageManager];
    const binPath = joinPaths(installDir, bin);
    tracer.trace("running-binary", `Running binary ${binPath}`);

    await runPackageManager(host, packageManagerConfig, binPath, directory, stdio);
    return diagnostics.diagnostics;
  } catch (e) {
    if (e instanceof DiagnosticError) {
      return [...diagnostics.diagnostics, ...e.diagnostics];
    } else {
      throw e;
    }
  }
}

async function runPackageManager(
  host: CliCompilerHost,
  packageManager: PackageManagerConfig,
  binPath: string,
  directory: string,
  stdio: "inherit" | "pipe",
) {
  const child = fork(binPath, packageManager.commands.install, {
    stdio,
    cwd: directory,
    env: {
      ...process.env,
      TYPESPEC_CLI_PASSTHROUGH: "1",
    },
  });

  const stdout: string[] = [];
  if (child.stdout) {
    child.stdout.on("data", (data) => {
      stdout.push(data.toString());
    });
  }
  if (child.stderr) {
    child.stderr.on("data", (data) => {
      stdout.push(data.toString());
    });
  }

  await new Promise<void>((resolve, reject) => {
    child.on("error", (error: SpawnError) => {
      if (error.code === "ENOENT") {
        host.logger.error(
          "Cannot find `npm` executable. Make sure to have npm installed in your path.",
        );
      } else {
        host.logger.error(error.toString());
      }
      process.exit(error.errno);
    });
    child.on("exit", (exitCode) => {
      if (exitCode !== 0) {
        reject(new Error(`Npm installed failed with exit code ${exitCode}\n${stdout.join("\n")}`));
      } else {
        resolve();
      }
    });
  });
}

async function isDirectory(host: CliCompilerHost, path: string) {
  try {
    const stats = await host.stat(path);
    return stats.isDirectory();
  } catch (e: any) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      return false;
    }
    throw e;
  }
}
