import { createDiagnostic } from "../../messages.js";
import { Diagnostic, NoTarget } from "../../types.js";
import { CliCompilerHost } from "../types.js";
import { reportDeprecatedCommand, run } from "../utils.js";

/** Marketplace identifier of the TypeSpec VS Code extension. */
const VSCODE_EXTENSION_ID = "microsoft.typespec-vscode";

/** Documentation page describing how to install/manage the VS Code extension. */
const VSCODE_DOCS_URL = "https://typespec.io/docs/introduction/editor/vscode/";

export interface InstallVSCodeExtensionOptions {
  insiders: boolean;
}
export async function installVSCodeExtension(
  host: CliCompilerHost,
  options: InstallVSCodeExtensionOptions,
): Promise<readonly Diagnostic[]> {
  reportDeprecatedCommand(host, "tsp code install", VSCODE_DOCS_URL);
  return runCode(host, ["--install-extension", VSCODE_EXTENSION_ID], options.insiders);
}

export interface UninstallVSCodeExtensionOptions {
  insiders: boolean;
}

export async function uninstallVSCodeExtension(
  host: CliCompilerHost,
  options: UninstallVSCodeExtensionOptions,
) {
  reportDeprecatedCommand(host, "tsp code uninstall", VSCODE_DOCS_URL);
  return runCode(host, ["--uninstall-extension", VSCODE_EXTENSION_ID], options.insiders);
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
