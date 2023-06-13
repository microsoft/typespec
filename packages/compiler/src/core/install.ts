import { spawn } from "child_process";

interface SpawnError {
  errno: number;
  code: "ENOENT";
  sysCall: string;
  path: string;
  spawnArgs: string[];
}

export async function installTypeSpecDependencies(directory: string): Promise<void> {
  const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(cmd, ["install"], {
    stdio: "inherit",
    cwd: directory,
    env: process.env,
  });

  return new Promise(() => {
    child.on("error", (error: SpawnError) => {
      if (error.code === "ENOENT") {
        // eslint-disable-next-line no-console
        console.error(
          "Cannot find `npm` executable. Make sure to have npm installed in your path."
        );
      } else {
        // eslint-disable-next-line no-console
        console.error("Error", error);
      }
      process.exit(error.errno);
    });
    child.on("exit", (exitCode) => {
      process.exit(exitCode ?? -1);
    });
  });
}
