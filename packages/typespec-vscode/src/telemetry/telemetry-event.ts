import { ResultCode } from "../types.js";
import { isWhitespaceStringOrUndefined } from "../utils.js";

export enum TelemetryEventName {
  StartExtension = "start-extension",
  CreateProject = "create-project",
  InstallGlobalCompilerCli = "install-global-compiler-cli",
  RestartServer = "restart-server",
  GenerateCode = "generate-code",
  ImportFromOpenApi3 = "import-from-openapi3",
  /** For extra log we need in telemetry.
   *  IMPORTANT: make sure to:
   *   - Collect as *little* telemetry as possible.
   *   - Do not include any personal or sensitive information.
   *  Detail guidance can be found at: https://code.visualstudio.com/api/extension-guides/telemetry
   */
  Log = "typespec/log",
}

export interface BaseTelemetryEvent {
  /**
   * all the telemetry events from the same activity should have the same activityId
   * if not provided, a new activityId will be generated
   */
  activityId: string;
  /**
   * the name of the event
   */
  eventName: TelemetryEventName;
}

export interface OperationTelemetryEvent extends BaseTelemetryEvent {
  eventName: TelemetryEventName;
  startTime: Date;
  endTime?: Date;
  result?: ResultCode;
  /**
   * the last step when the operation finish successfully or not
   */
  lastStep?: string;
}

/**
 * Create a operation telemetry event with following default values.
 * Please make sure the default values are updated properly as needed
 *     activityId: a new random guid will be generated if not provided
 *     eventName: the event name provided
 *     startTime: set to the current time
 *     endTime: undefined
 *     result: undefined
 *     lastStep: undefined
 */
export function createOperationTelemetryEvent(
  eventName: TelemetryEventName,
  activityId?: string,
): OperationTelemetryEvent {
  return {
    activityId: isWhitespaceStringOrUndefined(activityId) ? generateActivityId() : activityId!,
    eventName: eventName,
    startTime: new Date(),
    endTime: undefined,
    result: undefined,
    lastStep: undefined,
  };
}

export function generateActivityId() {
  return crypto.randomUUID();
}

export const emptyActivityId = "00000000-0000-0000-0000-000000000000";
