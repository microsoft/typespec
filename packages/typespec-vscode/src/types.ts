export const enum SettingName {
  TspServerPath = "typespec.tsp-server.path",
  InitTemplatesUrls = "typespec.initTemplatesUrls",
}

export const enum CommandName {
  ShowOutputChannel = "typespec.showOutputChannel",
  RestartServer = "typespec.restartServer",
  InstallGlobalCompilerCli = "typespec.installGlobalCompilerCli",
  CreateProject = "typespec.createProject",
  OpenUrl = "typespec.openUrl",
  GenerateCode = "typespec.generateCode",
  ImportFromOpenApi3 = "typespec.importFromOpenApi3",
}

export interface InstallGlobalCliCommandArgs {
  /**
   * whether to confirm with end user before action
   * default: false
   */
  confirm: boolean;
  confirmTitle?: string;
  confirmPlaceholder?: string;
  /**
   * set to true to disable popup notification and show output channel when running the command
   */
  silentMode?: boolean;
}

export interface RestartServerCommandArgs {
  /**
   * whether to recreate TspLanguageClient instead of just restarting it
   */
  forceRecreate: boolean;
  notificationMessage?: string;
}

export const enum ResultCode {
  Success = "success",
  Fail = "fail",
  Cancelled = "cancelled",
  Timeout = "timeout",
}

interface SuccessResult<T> {
  code: ResultCode.Success;
  value: T;
  details?: any;
}

interface UnsuccessResult {
  code: ResultCode.Fail | ResultCode.Cancelled | ResultCode.Timeout;
  details?: any;
}

export type Result<T = void> = SuccessResult<T> | UnsuccessResult;
