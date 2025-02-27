import { EmptyGuid } from "../const.js";
import { ResultCode } from "../types.js";

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

export enum OperationDetailPropertyName {
  error,
  emitterPackage,
  emitterVersion,
  emitResult,
  compilerLocation,
  compilerVersion,
}

export function generateActivityId() {
  return crypto.randomUUID();
}

export const emptyActivityId = EmptyGuid;
