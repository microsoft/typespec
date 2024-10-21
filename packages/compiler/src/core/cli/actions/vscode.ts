import { createDiagnostic } from "../../messages.js";
import { Diagnostic, NoTarget } from "../../types.js";
import { installVsix } from "../install-vsix.js";
import { CliCompilerHost } from "../types.js";
import { run } from "../utils.js";

export interface InstallVSCodeExtensionOptions {
  insiders: boolean;
}
export async function installVSCodeExtension(
  host: CliCompilerHost,
  options: InstallVSCodeExtensionOptions,
) {
  return await installVsix(host, "typespec-vscode", (vsixPaths) =>
    runCode(host, ["--install-extension", vsixPaths[0]], options.insiders),
  );
}

export interface UninstallVSCodeExtensionOptions {
  insiders: boolean;
}

export async function uninstallVSCodeExtension(
  host: CliCompilerHost,
  options: UninstallVSCodeExtensionOptions,
) {
  return runCode(host, ["--uninstall-extension", "microsoft.typespec-vscode"], options.insiders);
}

function runCode(
  host: CliCompilerHost,
  codeArgs: string[],
  insiders: boolean,
): readonly Diagnostic[] {
  try {
    run(host, insiders ? "code-insiders" : "code", codeArgs, {
      // VS Code's CLI emits node warnings that we can't do anything about. Suppress them.
      extraEnv: { NODE_NO_WARNINGS: "1" },
      allowNotFound: true,
    });
    return [];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      host.logger.trace(error.stack);
      return [
        createDiagnostic({
          code: "vscode-in-path",
          messageId: process.platform === "darwin" ? "osx" : "default",
          target: NoTarget,
        }),
      ];
    }
    throw error;
  }
}
