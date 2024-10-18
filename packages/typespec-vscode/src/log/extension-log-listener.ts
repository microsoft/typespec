import vscode from "vscode";
import { LogItem, LogListener, LogOptions } from "./logger.js";

export interface ExtensionLogOptions extends LogOptions {
  /** show the Output window in vscode */
  showOutput: boolean;
  /** show the log in vscode popup */
  showPopup: boolean;
}

export class ExtensionLogListener implements LogListener {
  constructor(private outputChannel?: vscode.LogOutputChannel) {}

  Log(log: LogItem) {
    const VIEW_DETAIL_IN_OUTPUT = "View details in Output";
    const { showOutput, showPopup } = log.options ?? { showOutput: false, showPopup: false };
    let popupAction: ((msg: string, ...items: string[]) => Thenable<string>) | undefined;
    switch (log.level) {
      case "error":
        this.outputChannel?.error(log.message, ...(log.details ?? []));
        popupAction = vscode.window.showErrorMessage;
        break;
      case "trace":
        this.outputChannel?.trace(log.message, ...(log.details ?? []));
        break;
      case "debug":
        this.outputChannel?.debug(log.message, ...(log.details ?? []));
        popupAction = vscode.window.showInformationMessage;
        break;
      case "info":
        this.outputChannel?.info(log.message, ...(log.details ?? []));
        popupAction = vscode.window.showInformationMessage;
        break;
      case "warn":
        this.outputChannel?.warn(log.message, ...(log.details ?? []));
        popupAction = vscode.window.showWarningMessage;
        break;
    }
    if (showOutput && this.outputChannel) {
      this.outputChannel.show(true /*preserveFocus*/);
    }

    if (showPopup && popupAction) {
      void popupAction(log.message, VIEW_DETAIL_IN_OUTPUT).then((value) => {
        if (value === VIEW_DETAIL_IN_OUTPUT) {
          this.outputChannel?.show(true /*preserveFocus*/);
        }
      });
    }
  }
}
