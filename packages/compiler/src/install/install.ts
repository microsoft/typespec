import Arborist from "@npmcli/arborist";
import { fork, spawn } from "child_process";
import { mkdir, rm } from "fs/promises";
import { homedir } from "os";
import { CliCompilerHost } from "../core/cli/types.js";
import { createTracer } from "../core/logger/tracer.js";
import { joinPaths } from "../core/path-utils.js";
import {
  downloadAndExtractPackage,
  fetchLatestPackageManifest,
} from "../package-manger/npm-registry-utils.js";

interface SpawnError {
  errno: number;
  code: "ENOENT";
  sysCall: string;
  path: string;
  spawnArgs: string[];
}

const tspDir = homedir() + "/.tsp";
const pmDir = joinPaths(tspDir, "pm");

export async function installTypeSpecDependencies(
  host: CliCompilerHost,
  directory: string,
  stdio: "inherit" | "pipe" = "inherit",
): Promise<void> {
  const packageManager = "npm";
  const tracer = createTracer(host.logger, { filter: ["*"] }).sub("install");
  const manifest = await fetchLatestPackageManifest(packageManager);
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

  return new Promise((resolve, reject) => {
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

  // // Only use the builtin npm when running in standalone tsp mode.
  // // TBD how we'll change this as we move to a more integrated setup and resolve the user package manager.
  // if (getTypeSpecEngine() === "tsp") {
  //   await installWithBuiltinNpm(host, directory);
  // } else {
  //   await installWithNpmExe(host, directory, stdio);
  // }
}

async function installWithBuiltinNpm(host: CliCompilerHost, directory: string): Promise<void> {
  const arb = new Arborist({
    path: directory,
  });

  await arb.loadActual();
  await arb.buildIdealTree({});
  await arb.reify();
}

async function installWithNpmExe(
  host: CliCompilerHost,
  directory: string,
  stdio: "inherit" | "pipe",
): Promise<void> {
  const child = spawn("npm", ["install"], {
    shell: process.platform === "win32",
    stdio: "pipe",
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

  return new Promise((resolve, reject) => {
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
