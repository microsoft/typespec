import { spawn, type SpawnOptions } from "child_process";

export interface ExecResult {
  readonly code: number | null;
  readonly stdall: Buffer;
  readonly stdout: Buffer;
  readonly stderr: Buffer;
}
export function execAsync(
  cmd: string,
  args: string[],
  opts: SpawnOptions = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, opts);
    let stdall = Buffer.from("");
    let stdout = Buffer.from("");
    let stderr = Buffer.from("");

    if (child.stdout) {
      child.stdout.on("data", (data) => {
        stdout = Buffer.concat([stdout, data]);
        stdall = Buffer.concat([stdall, data]);
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        stderr = Buffer.concat([stderr, data]);
        stdall = Buffer.concat([stdall, data]);
      });
    }

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr, stdall });
    });
  });
}
