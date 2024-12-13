import vscode, { QuickPickItem } from "vscode";
import logger from "../log/logger.js";
import { InstallGlobalCliCommandArgs } from "../types.js";
import { createPromiseWithCancelAndTimeout, spawnExecutionAndLogToOutput } from "../utils.js";

const COMPILER_REQUIREMENT =
  "Minimum Requirements: 'Node.js 20 LTS' && 'npm avaliable in command prompt'";

export async function installCompilerGlobally(
  args: InstallGlobalCliCommandArgs | undefined,
): Promise<boolean> {
  // confirm with end user by default
  if (args?.confirm !== false) {
    const yes: QuickPickItem = {
      label: "Install TypeSpec Compiler/CLI globally",
      detail: COMPILER_REQUIREMENT,
      description: " by 'npm install -g @typespec/compiler'",
    };
    const no: QuickPickItem = { label: "Cancel" };
    const title = args?.confirmTitle ?? "Please check the requirements and confirm...";
    const confirm = await vscode.window.showQuickPick<QuickPickItem>([yes, no], {
      title,
      placeHolder: args?.confirmPlaceholder ?? title,
    });
    if (confirm !== yes) {
      logger.info("User cancelled the installation of TypeSpec Compiler/CLI");
      return false;
    } else {
      logger.info("User confirmed the installation of TypeSpec Compiler/CLI");
    }
  } else {
    logger.info("Installing TypeSpec Compiler/CLI with confirmation disabled explicitly...");
  }
  return await vscode.window.withProgress<boolean>(
    {
      title: "Installing TypeSpec Compiler/CLI...",
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
    },
    async (_progress, token) => {
      const TIMEOUT = 300000; // set timeout to 5 minutes which should be enough for installing compiler
      try {
        const output = await createPromiseWithCancelAndTimeout(
          spawnExecutionAndLogToOutput(
            "npm",
            ["install", "-g", "@typespec/compiler"],
            process.cwd(),
          ),
          token,
          TIMEOUT,
        );
        if (output.exitCode !== 0) {
          logger.error(
            "Failed to install TypeSpec CLI. Please check the previous log for details",
            [output],
            { showOutput: true, showPopup: true },
          );
          return false;
        } else {
          logger.info("TypeSpec CLI installed successfully");
          return true;
        }
      } catch (e) {
        if (e === "cancelled") {
          logger.info("Installation of TypeSpec Compiler/CLI is cancelled by user");
          return false;
        } else if (e === "timeout") {
          logger.error(`Installation of TypeSpec Compiler/CLI is timeout after ${TIMEOUT}ms`);
          return false;
        } else {
          logger.error("Unexpected error when installing TypeSpec Compiler/CLI", [e]);
          return false;
        }
      }
    },
  );
}
