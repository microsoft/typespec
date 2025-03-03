import { fork } from "child_process";
import { mkdir, rm } from "fs/promises";
import { homedir } from "os";
import { CliCompilerHost } from "../core/cli/types.js";
import { DiagnosticError } from "../core/diagnostic-error.js";
import { createTracer } from "../core/logger/tracer.js";
import { joinPaths } from "../core/path-utils.js";
import { NoTarget, type Diagnostic } from "../core/types.js";
import {
  downloadAndExtractPackage,
  fetchPackageManifest,
} from "../package-manger/npm-registry-utils.js";
import { resolvePackageManagerSpec } from "./spec.js";

interface SpawnError {
  errno: number;
  code: "ENOENT";
  sysCall: string;
  path: string;
  spawnArgs: string[];
}

const tspDir = homedir() + "/.tsp";
const pmDir = joinPaths(tspDir, "pm");

export class InstallDependenciesError extends Error {}

export async function installTypeSpecDependencies(
  host: CliCompilerHost,
  directory: string,
  stdio: "inherit" | "pipe" = "inherit",
): Promise<readonly Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const tracer = createTracer(host.logger).sub("install");
  try {
    const spec = await resolvePackageManagerSpec(host, tracer, directory);

    let version;
    let packageManager;
    switch (spec.kind) {
      case "no-package":
        throw new InstallDependenciesError("No package.json found, cannot install dependencies.");
      case "no-spec":
        packageManager = "npm";
        version = "latest";
        diagnostics.push({
          code: "no-package-manager-spec",
          severity: "warning",
          message:
            "No package manager spec found, defaulted to npm latest version. Please set devEngines.packageManager or packageManager in your package.json.",
          target: NoTarget,
        });
        break;
      case "resolved":
        packageManager = spec.spec.name;
        version = spec.spec.range;
        break;
    }

    const manifest = await fetchPackageManifest(packageManager, version);
    tracer.trace(
      "fetched-manifest",
      `Resolved manifest for ${packageManager} at version ${manifest.version}`,
    );

    const installDir = joinPaths(pmDir, packageManager, manifest.version);
    await rm(installDir, { recursive: true, force: true });
    await mkdir(installDir, { recursive: true });
    await downloadAndExtractPackage(manifest, installDir);
    tracer.trace("downloaded", `Downloaded and extracted at ${installDir}`);
    const bin = manifest.bin![packageManager];
    const binPath = joinPaths(installDir, bin);
    tracer.trace("running-binary", `Running binary ${binPath}`);

    await runPackageManager(host, binPath, directory, stdio);
    return diagnostics;
  } catch (e) {
    if (e instanceof DiagnosticError) {
      return [...diagnostics, ...e.diagnostics];
    } else {
      throw e;
    }
  }
}

async function runPackageManager(
  host: CliCompilerHost,
  binPath: string,
  directory: string,
  stdio: "inherit" | "pipe",
) {
  const child = fork(binPath, ["install"], {
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
