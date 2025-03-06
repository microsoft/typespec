import vscode from "vscode";
import { LogItem, LogLevel, LogListener, LogOptions } from "./logger.js";

export interface ExtensionLogOptions extends LogOptions {
  /** show the Output window in vscode */
  showOutput?: boolean;
  /** show the log in vscode popup */
  showPopup?: boolean;
  /** the text of the button in the popup notification, default is 'View details in Output', "" to remove the button */
  popupButtonText?: string;
  /** callback when the button in the popup notification is clicked, default is to open the TypeSpec Output */
  onPopupButtonClicked?: () => void;
}

export function getPopupAction(loglevel: LogLevel) {
  switch (loglevel) {
    case "error":
      return vscode.window.showErrorMessage;
    case "warn":
      return vscode.window.showWarningMessage;
    case "debug":
    case "info":
      return vscode.window.showInformationMessage;
    default: // trace
      return undefined;
  }
}

export class ExtensionLogListener implements LogListener {
  constructor(private outputChannel?: vscode.LogOutputChannel) {}

  Log(log: LogItem) {
    const VIEW_DETAIL_IN_OUTPUT = "View details in Output";
    const { showOutput, showPopup, popupButtonText, onPopupButtonClicked } = log.options ?? {
      showOutput: false,
      showPopup: false,
    };
    let popupAction: ((msg: string, ...items: string[]) => Thenable<string>) | undefined;
    switch (log.level) {
      case "error":
        this.outputChannel?.error(log.message, ...(log.details ?? []));
        popupAction = getPopupAction(log.level);
        break;
      case "trace":
        this.outputChannel?.trace(log.message, ...(log.details ?? []));
        break;
      case "debug":
        this.outputChannel?.debug(log.message, ...(log.details ?? []));
        popupAction = getPopupAction(log.level);
        break;
      case "info":
        this.outputChannel?.info(log.message, ...(log.details ?? []));
        popupAction = getPopupAction(log.level);
        break;
      case "warn":
        this.outputChannel?.warn(log.message, ...(log.details ?? []));
        popupAction = getPopupAction(log.level);
        break;
    }
    if (showOutput && this.outputChannel) {
      this.outputChannel.show(true /*preserveFocus*/);
    }

    if (showPopup && popupAction) {
      const buttonText = popupButtonText ?? VIEW_DETAIL_IN_OUTPUT;
      void popupAction(log.message, buttonText).then((value) => {
        if (value === buttonText) {
          if (onPopupButtonClicked) {
            onPopupButtonClicked();
          } else {
            this.outputChannel?.show(true /*preserveFocus*/);
          }
        }
      });
    }
  }
}
