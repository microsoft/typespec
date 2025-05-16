import logger from "../log/logger.js";
import telemetryClient from "../telemetry/telemetry-client.js";
import { TelemetryEventName } from "../telemetry/telemetry-event.js";
import { InstallGlobalCliCommandArgs, Result, ResultCode } from "../types.js";
import { installCompilerWithUi } from "../typespec-utils.js";

export async function installCompilerGlobally(
  args: InstallGlobalCliCommandArgs | undefined,
): Promise<Result<void>> {
  return telemetryClient.doOperationWithTelemetry(
    TelemetryEventName.InstallGlobalCompilerCli,
    async (tel) => {
      const showPopup = args?.silentMode !== true;
      const result = await installCompilerWithUi(
        {
          confirmNeeded: args?.confirm !== false,
          confirmTitle: args?.confirmTitle,
          confirmPlaceholder: args?.confirmPlaceholder,
        },
        [] /*localPath, empty for global*/,
      );
      if (result.code === ResultCode.Success) {
        logger.info(`Compiler installed successfully`, [], { showPopup });
      } else if (result.code === ResultCode.Fail || result.code === ResultCode.Timeout) {
        logger.error(
          `Installing compiler ${result.code === ResultCode.Fail ? "failed" : "timeout"}. Please check previous logs for details`,
          [],
          { showPopup },
        );
      }
      return result;
    },
    args?.activityId,
  );
}
