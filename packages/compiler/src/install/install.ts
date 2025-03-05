import { fork } from "child_process";
import { mkdir, rm } from "fs/promises";
import { homedir } from "os";
import type { CliCompilerHost } from "../core/cli/types.js";
import { DiagnosticError } from "../core/diagnostic-error.js";
import { createDiagnosticCollector } from "../core/index.js";
import { createTracer } from "../core/logger/tracer.js";
import { joinPaths } from "../core/path-utils.js";
import { NoTarget, type Diagnostic, type Tracer } from "../core/types.js";
import {
  downloadAndExtractPackage,
  fetchPackageManifest,
} from "../package-manger/npm-registry-utils.js";
import { getPackageManagerConfig, type PackageManagerConfig } from "./config.js";
import {
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

const tspDir = homedir() + "/.tsp";
const pmDir = joinPaths(tspDir, "pm");

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
    await rm(installDir, { recursive: true, force: true });
    await mkdir(installDir, { recursive: true });
    const extractResult = await downloadAndExtractPackage(
      manifest,
      installDir,
      spec.hash?.algorithm,
    );
    if (spec.hash) {
      if (spec.hash.value !== extractResult.hash.value) {
        throw new InstallDependenciesError(
          `Mismatch hash for package manager. (${spec.hash.algorithm})\n  Expected: ${spec.hash.value}\n  Actual:   ${extractResult.hash}`,
        );
      }
    }

    if (savePackageManager) {
      await updatePackageManagerInPackageJson(host, packageJsonPath, {
        name: spec.name,
        range: manifest.version,
        hash: extractResult.hash,
      });
    }
    tracer.trace("downloaded", `Downloaded and extracted at ${installDir}`);
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
    env: process.env,
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
