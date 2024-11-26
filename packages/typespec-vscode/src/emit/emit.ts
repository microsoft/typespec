import { dirname } from "path";
import { Executable } from "vscode-languageclient/node.js";
import { ExecOutput, executeCommand } from "../utils.js";

export async function compile(
  cli: Executable,
  startFile: string,
  emitter: string,
  options: Record<string, string>,
): Promise<ExecOutput> {
  const args: string[] = cli.args ?? [];
  args.push("compile");
  args.push(startFile);
  if (emitter) {
    args.push("--emit", emitter);
  }

  for (const [key, value] of Object.entries(options)) {
    args.push("--option", `${emitter}.${key}=${value}`);
  }

  return await executeCommand(cli.command, args, {
    cwd: dirname(startFile),
  });
}

export async function check(): Promise<{
  valid: boolean;
  required: { name: string; version: string }[];
}> {
  return { valid: true, required: [] };
}
