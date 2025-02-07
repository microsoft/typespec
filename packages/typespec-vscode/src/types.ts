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
}

export interface RestartServerCommandArgs {
  /**
   * whether to recreate TspLanguageClient instead of just restarting it
   */
  forceRecreate: boolean;
  popupRecreateLspError: boolean;
}
