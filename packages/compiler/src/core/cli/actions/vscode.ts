import { installVsix } from "../install-vsix.js";
import { run } from "../utils.js";

export async function installVSCodeExtension(insiders: boolean, debug: boolean) {
  await installVsix(
    "typespec-vscode",
    (vsixPaths) => {
      runCode(["--install-extension", vsixPaths[0]], insiders, debug);
    },
    debug
  );
}

export async function uninstallVSCodeExtension(insiders: boolean, debug: boolean) {
  await runCode(["--uninstall-extension", "microsoft.typespec-vscode"], insiders, debug);
}

function runCode(codeArgs: string[], insiders: boolean, debug: boolean) {
  try {
    run(insiders ? "code-insiders" : "code", codeArgs, {
      // VS Code's CLI emits node warnings that we can't do anything about. Suppress them.
      extraEnv: { NODE_NO_WARNINGS: "1" },
      debug,
      allowNotFound: true,
    });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // eslint-disable-next-line no-console
      console.error(
        `error: Couldn't find VS Code 'code' command in PATH. Make sure you have the VS Code executable added to the system PATH.`
      );
      if (process.platform === "darwin") {
        // eslint-disable-next-line no-console
        console.log("See instruction for Mac OS here https://code.visualstudio.com/docs/setup/mac");
      }
      if (debug) {
        // eslint-disable-next-line no-console
        console.log(error.stack);
      }
      process.exit(1);
    }
  }
}
