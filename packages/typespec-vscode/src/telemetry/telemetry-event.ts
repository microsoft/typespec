import { EmptyGuid } from "../const.js";
import { ResultCode } from "../types.js";

export interface RawTelemetryEvent {
  eventName: string;
  properties?: { [key: string]: string };
  measurements?: { [key: string]: number };
}

export enum TelemetryEventName {
  StartExtension = "start-extension",
  CreateProject = "create-project",
  InstallGlobalCompilerCli = "install-global-compiler-cli",
  RestartServer = "restart-server",
  EmitCode = "emit-code",
  ImportFromOpenApi3 = "import-from-openapi3",
  ServerPathSettingChanged = "server-path-changed",
  OperationDetail = "operation-detail",
  PreviewOpenApi3 = "preview-openapi3",
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
  emitterName,
  emitterVersion,
  emitResult,
  compilerLocation,
  compilerVersion,
}

export function generateActivityId() {
  return crypto.randomUUID();
}

export const emptyActivityId = EmptyGuid;
