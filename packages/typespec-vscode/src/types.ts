import { TspLanguageClient } from "./tsp-language-client.js";
import { InitTemplatesUrlSetting } from "./vscode-cmd/create-tsp-project.js";

export const enum SettingName {
  TspServerPath = "typespec.tsp-server.path",
  InitTemplatesUrls = "typespec.initTemplatesUrls",
  CompileEntrypoint = "typespec.entrypoint",
}

export const enum CommandName {
  ShowOutputChannel = "typespec.showOutputChannel",
  RestartServer = "typespec.restartServer",
  InstallGlobalCompilerCli = "typespec.installGlobalCompilerCli",
  CreateProject = "typespec.createProject",
  EmitCode = "typespec.emitCode",
  ImportFromOpenApi3 = "typespec.importFromOpenApi3",
  ShowOpenApi3 = "typespec.showOpenApi3",
}

export const enum CodeActionCommand {
  OpenUrl = "typespec.openUrl",
  NpmInstallPackage = "typespec.npmInstallPackage",
}

export type RestartServerCommandResult = Result<TspLanguageClient>;

export interface BaseCommandArgs {
  activityId: string;
}

export interface InstallGlobalCliCommandArgs extends BaseCommandArgs {
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

export interface RestartServerCommandArgs extends BaseCommandArgs {
  /**
   * whether to recreate TspLanguageClient instead of just restarting it
   */
  forceRecreate: boolean;
  notificationMessage?: string;
}

export enum ResultCode {
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

export interface TypeSpecExtensionApi {
  /** Register more InitTemplateUrls which will be included in the Create TypeSpec Project scenario */
  registerInitTemplateUrls(items: InitTemplatesUrlSetting[]): void;
}
