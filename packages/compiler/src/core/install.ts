import Arborist from "@npmcli/arborist";
import { spawn } from "child_process";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { CliCompilerHost } from "./cli/types.js";
import { joinPaths } from "./path-utils.js";

interface SpawnError {
  errno: number;
  code: "ENOENT";
  sysCall: string;
  path: string;
  spawnArgs: string[];
}

export async function installTypeSpecDependencies(
  host: CliCompilerHost,
  directory: string,
): Promise<void> {
  await installWithBuiltinNpm(host, directory);
}

async function installWithBuiltinNpm(host: CliCompilerHost, directory: string): Promise<void> {
  const installDir = joinPaths(homedir(), ".tsp/installs");
  await mkdir(installDir, { recursive: true });

  const arb = new Arborist({
    path: installDir,
  });

  await arb.loadActual();
  await arb.buildIdealTree({});
  await arb.reify();
}

// Keeping here for now as we'll try to figure out which pm user is using and delegate to that.
async function _installWithNpmExe(host: CliCompilerHost, directory: string): Promise<void> {
  const child = spawn("npm", ["install"], {
    shell: process.platform === "win32",
    stdio: "inherit",
    cwd: directory,
    env: process.env,
  });

  return new Promise(() => {
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
      process.exit(exitCode ?? -1);
    });
  });
}
