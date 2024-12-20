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
   * The command won't show output window or popup notification in silent mode
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

export interface Result<T> {
  code: ResultCode;
  value?: T;
  details?: any;
}
