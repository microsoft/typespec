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
export class OperationDetailProperties {
  error = "error";
  emitterPackage = "emitterPackage";
  compilerLocation = "compilerLocation";
  compilerVersion = "compilerVersion";
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
    Partial<Record<keyof OperationDetailProperties, string>> {
  eventName: TelemetryEventName.OperationDetail;
}

export function generateActivityId() {
  return crypto.randomUUID();
}

export const emptyActivityId = "00000000-0000-0000-0000-000000000000";
