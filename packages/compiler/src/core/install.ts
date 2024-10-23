import { spawn } from "child_process";
import { CliCompilerHost } from "./cli/types.js";

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
