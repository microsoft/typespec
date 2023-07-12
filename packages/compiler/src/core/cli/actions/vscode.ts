import { installVsix } from "../install-vsix.js";
import { CliCompilerHost } from "../types.js";
import { run } from "../utils.js";

export interface InstallVSCodeExtensionOptions {
  insiders: boolean;
}
export async function installVSCodeExtension(
  host: CliCompilerHost,
  options: InstallVSCodeExtensionOptions
) {
  await installVsix(host, "typespec-vscode", (vsixPaths) => {
    runCode(host, ["--install-extension", vsixPaths[0]], options.insiders);
  });
}

export interface UninstallVSCodeExtensionOptions {
  insiders: boolean;
}

export async function uninstallVSCodeExtension(
  host: CliCompilerHost,
  options: UninstallVSCodeExtensionOptions
) {
  await runCode(host, ["--uninstall-extension", "microsoft.typespec-vscode"], options.insiders);
}

function runCode(host: CliCompilerHost, codeArgs: string[], insiders: boolean) {
  try {
    run(host, insiders ? "code-insiders" : "code", codeArgs, {
      // VS Code's CLI emits node warnings that we can't do anything about. Suppress them.
      extraEnv: { NODE_NO_WARNINGS: "1" },
      allowNotFound: true,
    });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      host.logger.error(
        `Couldn't find VS Code 'code' command in PATH. Make sure you have the VS Code executable added to the system PATH.`
      );
      if (process.platform === "darwin") {
        // eslint-disable-next-line no-console
        console.log("See instruction for Mac OS here https://code.visualstudio.com/docs/setup/mac");
      }
      // eslint-disable-next-line no-console
      host.logger.trace(error.stack);
      process.exit(1);
    }
  }
}
