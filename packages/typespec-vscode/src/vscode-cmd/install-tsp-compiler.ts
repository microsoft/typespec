import vscode, { QuickPickItem } from "vscode";
import logger from "../log/logger.js";
import telemetryClient from "../telemetry/telemetry-client.js";
import { TelemetryEventName } from "../telemetry/telemetry-event.js";
import { InstallGlobalCliCommandArgs, Result, ResultCode } from "../types.js";
import { createPromiseWithCancelAndTimeout, spawnExecutionAndLogToOutput } from "../utils.js";

const COMPILER_REQUIREMENT =
  "Minimum Requirements: Install Node.js 20 LTS or above and verify 'node -v' and 'npm -v' run in command prompt";

export async function installCompilerGlobally(
  args: InstallGlobalCliCommandArgs | undefined,
): Promise<Result<void>> {
  return telemetryClient.doOperationWithTelemetry(
    TelemetryEventName.InstallGlobalCompilerCli,
    async (tel) => {
      const showOutput = args?.silentMode !== true;
      const showPopup = args?.silentMode !== true;
      // confirm with end user by default
      if (args?.confirm !== false) {
        const detailLink = "https://typespec.io/docs/";
        const yes: QuickPickItem = {
          label: "Install TypeSpec Compiler/CLI globally",
          detail: COMPILER_REQUIREMENT,
          description: " by 'npm install -g @typespec/compiler'",
          buttons: [
            {
              iconPath: new vscode.ThemeIcon("link-external"),
              tooltip: `Open ${detailLink}`,
            },
          ],
        };
        const no: QuickPickItem = { label: "Cancel" };
        const title = args?.confirmTitle ?? "Please check the requirements and confirm...";
        const confirmPicker = vscode.window.createQuickPick();
        confirmPicker.items = [yes, no];
        confirmPicker.title = title;
        confirmPicker.ignoreFocusOut = true;
        confirmPicker.placeholder = args?.confirmPlaceholder ?? title;
        confirmPicker.onDidTriggerItemButton((event) => {
          if (event.item === yes) {
            vscode.env.openExternal(vscode.Uri.parse(detailLink));
          }
        });
        const p = new Promise<QuickPickItem[] | undefined>((resolve) => {
          confirmPicker.onDidAccept(() => {
            const selectedItem = [...confirmPicker.selectedItems];
            resolve(selectedItem);
            confirmPicker.hide();
          });
          confirmPicker.onDidHide(() => {
            resolve(undefined);
            confirmPicker.dispose();
          });
        });
        confirmPicker.show();
        const confirm = await p;

        if (!confirm || confirm.length === 0 || confirm[0] !== yes) {
          logger.info("User cancelled the installation of TypeSpec Compiler/CLI");
          tel.lastStep = "Confirm installation of TypeSpec Compiler/CLI";
          return { code: ResultCode.Cancelled };
        } else {
          logger.info("User confirmed the installation of TypeSpec Compiler/CLI");
        }
      } else {
        logger.info("Installing TypeSpec Compiler/CLI with confirmation disabled explicitly...");
      }
      return await vscode.window.withProgress<Result<void>>(
        {
          title: "Installing TypeSpec Compiler/CLI...",
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
        },
        async (_progress, token) => {
          const TIMEOUT = 300000; // set timeout to 5 minutes which should be enough for installing compiler
          try {
            await createPromiseWithCancelAndTimeout(
              spawnExecutionAndLogToOutput(
                "npm",
                ["install", "-g", "@typespec/compiler"],
                process.cwd(),
              ),
              token,
              TIMEOUT,
            );

            logger.info("TypeSpec Compiler/CLI installed successfully", [], {
              showOutput: false,
              showPopup,
            });
            return { code: ResultCode.Success, value: undefined };
          } catch (e: any) {
            tel.lastStep = "Installing TypeSpec Compiler/CLI";
            if (e === ResultCode.Cancelled) {
              return { code: ResultCode.Cancelled };
            } else if (e === ResultCode.Timeout) {
              logger.error(
                `Installation of TypeSpec Compiler/CLI is timeout after ${TIMEOUT}ms`,
                [e],
                {
                  showOutput,
                  showPopup,
                },
              );
              return { code: ResultCode.Timeout };
            } else {
              logger.error(
                `Installing TypeSpec Compiler/CLI failed. Please make sure the pre-requisites below has been installed properly. And you may check the previous log for more detail.\n` +
                  COMPILER_REQUIREMENT +
                  "\n" +
                  `More detail about typespec compiler: https://typespec.io/docs/\n` +
                  "More detail about nodejs: https://nodejs.org/en/download/package-manager\n",
                [e],
                {
                  showOutput,
                  showPopup,
                },
              );
              return { code: ResultCode.Fail, details: e };
            }
          }
        },
      );
    },
    args?.activityId,
  );
}
