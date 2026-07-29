import { inspect } from "util";
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
      tel.lastStep = "Call installCompilerWithUi";
      const result = await installCompilerWithUi(
        {
          confirmNeeded: args?.confirm !== false,
          confirmTitle: args?.confirmTitle,
          confirmPlaceholder: args?.confirmPlaceholder,
        },
        [] /*localPath, empty for global*/,
      );
      if (result.code === ResultCode.Success) {
        tel.lastStep = "Compiler installed successfully";
        logger.info(`Compiler installed successfully`, [], { showPopup });
      } else if (result.code === ResultCode.Cancelled) {
        tel.lastStep = "User cancelled installation";
      } else if (result.code === ResultCode.Timeout) {
        tel.lastStep = "Installation timeout";
        telemetryClient.logOperationDetailTelemetry(tel.activityId, {
          error: `Installing compiler globally timeout`,
        });
        logger.error(`Installing compiler timeout. Please check previous logs for details`, [], {
          showPopup,
        });
      } else if (result.code === ResultCode.Fail) {
        tel.lastStep = "Installation failed";
        telemetryClient.logOperationDetailTelemetry(tel.activityId, {
          error: `Installing compiler globally failed: ${inspect(result.details)}`,
        });
        logger.error(`Installing compiler failed. Please check previous logs for details`, [], {
          showPopup,
        });
      }
      return result;
    },
    args?.activityId,
    (e) => {
      logger.error(`Unexpected error when installing compiler globally.`, [e]);
      return { code: ResultCode.Fail };
    },
  );
}
