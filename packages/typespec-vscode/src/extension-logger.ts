import vscode, { LogOutputChannel } from "vscode";

type Progress = vscode.Progress<{
  message?: string;
  increment?: number;
}>;

interface LogOptions {
  /** show the Output window in vscode */
  showOutput: boolean;
  /** show the log in vscode popup */
  showPopup: boolean;
  /** update the progress with the log */
  progress?: Progress;
}

export class ExtensionLogger {
  constructor(public outputChannel?: LogOutputChannel) {}

  private logInternal(
    msg: string,
    details?: any[],
    options?: LogOptions,
    logAction?: (msg: string, ...args: any[]) => void,
    popupAction?: (msg: string, ...items: string[]) => Thenable<string>,
  ) {
    const VIEW_DETAIL_IN_OUTPUT = "View details in Output";
    const { showOutput, showPopup, progress } = options ?? { showOutput: false, showPopup: false };
    if (logAction) logAction(msg, details ?? []);
    if (showOutput && this.outputChannel) {
      this.outputChannel.show(true /*preserveFocus*/);
    }

    if (showPopup && popupAction) {
      void popupAction(msg, VIEW_DETAIL_IN_OUTPUT).then((value) => {
        if (value === VIEW_DETAIL_IN_OUTPUT) {
          this.outputChannel?.show(true /*preserveFocus*/);
        }
      });
    }
    if (progress) {
      progress.report({ message: msg });
    }
  }

  info(message: string, details?: any[], options?: LogOptions): void {
    this.logInternal(
      message,
      details,
      options,
      (m, d) => this.outputChannel?.info(m, ...d),
      vscode.window.showInformationMessage,
    );
  }

  warning(message: string, details?: any[], options?: LogOptions) {
    this.logInternal(
      message,
      details,
      options,
      (m, d) => this.outputChannel?.warn(m, ...d),
      vscode.window.showWarningMessage,
    );
  }

  error(message: string, details?: any[], options?: LogOptions) {
    this.logInternal(
      message,
      details,
      options,
      (m, d) => this.outputChannel?.error(m, ...d),
      vscode.window.showErrorMessage,
    );
  }

  debug(message: string, details?: any[], options?: LogOptions) {
    this.logInternal(
      message,
      details,
      options,
      (m, d) => this.outputChannel?.debug(m, ...d),
      vscode.window.showInformationMessage,
    );
  }
}

const logger = new ExtensionLogger();
export default logger;
