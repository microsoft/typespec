import Arborist from "@npmcli/arborist";
import { spawn } from "child_process";
import { CliCompilerHost } from "./cli/types.js";
import { getTypeSpecEngine } from "./engine.js";

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
  // Only use the builtin npm when running in standalone tsp mode.
  // TBD how we'll change this as we move to a more integrated setup and resolve the user package manager.
  if (getTypeSpecEngine() === "tsp") {
    await installWithBuiltinNpm(host, directory);
  } else {
    await installWithNpmExe(host, directory);
  }
}

async function installWithBuiltinNpm(host: CliCompilerHost, directory: string): Promise<void> {
  const arb = new Arborist({
    path: directory,
  });

  await arb.loadActual();
  await arb.buildIdealTree({});
  await arb.reify();
}

async function installWithNpmExe(host: CliCompilerHost, directory: string): Promise<void> {
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
