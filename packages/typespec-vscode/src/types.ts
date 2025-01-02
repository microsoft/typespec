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
}

export interface RestartServerCommandArgs {
  /**
   * whether to recreate TspLanguageClient instead of just restarting it
   */
  forceRecreate: boolean;
  popupRecreateLspError: boolean;
}

export const enum ResultCode {
  Success = "success",
  Fail = "fail",
  Cancelled = "cancelled",
  Timeout = "timeout",
}

interface SuccessResult<T = void> {
  code: ResultCode.Success;
  value: T;
  details?: any;
}
interface UnsuccessResult {
  code: ResultCode.Fail | ResultCode.Cancelled | ResultCode.Timeout;
  details?: any;
}

export type Result<T = void> = SuccessResult<T> | UnsuccessResult;
