import { ResultCode } from "../types.js";
import { isWhitespaceStringOrUndefined } from "../utils.js";

export enum TelemetryEventName {
  StartExtension = "start-extension",
  CreateProject = "create-project",
  InstallGlobalCompilerCli = "install-global-compiler-cli",
  RestartServer = "restart-server",
  GenerateCode = "generate-code",
  ImportFromOpenApi3 = "import-from-openapi3",
  ServerPathSettingChanged = "server-path-changed",
  OperationDetail = "operation-detail",
}
export class OperationDetailProperties {
  error = "error";
  emitterPackage = "emitterPackage";
  compilerLocation = "compilerLocation";
}

export interface TelemetryEventBase {
  activityId: string;
  eventName: TelemetryEventName;
}

export interface OperationTelemetryEvent extends TelemetryEventBase {
  startTime: Date;
  endTime?: Date;
  result?: ResultCode;
  lastStep?: string;
}

export interface OperationDetailTelemetryEvent
  extends TelemetryEventBase,
    Partial<Record<keyof OperationDetailProperties, string>> {}

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
