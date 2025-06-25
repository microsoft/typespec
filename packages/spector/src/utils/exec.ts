import { ChildProcess, spawn, SpawnOptions } from "child_process";

export async function execAsync(
  command: string,
  args: string[],
  options: SpawnOptions = {},
): Promise<{ exitCode: number; stdout: string; stderr: string; out: string; proc: ChildProcess }> {
  const child = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      reject(error);
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const out: Buffer[] = [];
    child.stdout?.on("data", (data) => {
      stdout.push(data);
      out.push(data);
    });
    child.stderr?.on("data", (data) => {
      stderr.push(data);
      out.push(data);
    });

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
        out: Buffer.concat(out).toString(),
        proc: child,
      });
    });
  });
}
