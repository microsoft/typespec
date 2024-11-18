import { dirname } from "path";
import { executeCommand } from "../utils.js";

export async function compile(
  command: string,
  startFile: string,
  emit: string,
  outputDir?: string,
) {
  const args: string[] = [];
  args.push("compile");
  args.push(startFile);
  if (emit) {
    args.push("--emit", emit);
  }

  if (outputDir) {
    args.push("--option", `${emit}.emitter-output-dir=${outputDir}`);
  }

  await executeCommand(command, args, {
    cwd: dirname(startFile),
  });
}
