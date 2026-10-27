import type { Executable } from "vscode-languageclient/node";
import { VSCodeVariableResolver } from "./vscode-variable-resolver.js";

/**
 * Build the command and argument array for a tsp compile task. Arguments are passed
 * as an array (never concatenated into a shell string) so they can be executed
 * without invoking a shell, avoiding command injection through workspace paths or
 * task arguments.
 */
export function resolveTaskCommand(
  absoluteTargetPath: string,
  args: string[],
  cli: Executable,
  workspaceFolder: string,
): { command: string; args: string[] } {
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });
  const resolve = (value: string) => variableResolver.resolve(value);
  const commandArgs = [...(cli.args ?? []), "compile", absoluteTargetPath, ...args].map(resolve);
  return { command: resolve(cli.command), args: commandArgs };
}
