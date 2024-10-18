import vscode, { LogOutputChannel } from "vscode";

const TRACE_PREFIX = /^\[Trace.*?\] /iu;
const DEBUG_PREFIX = /^\[Debug.*?\] /iu;
const INFO_PREFIX = /^\[Info.*?\] /iu;
const WARN_PREFIX = /^\[Warn.*?\] /iu;
const ERROR_PREFIX = /^\[Error.*?\] /iu;

export class TypeSpecLogOutputChannel implements LogOutputChannel {
  private readonly delegate: LogOutputChannel;

  constructor(name: string) {
    this.delegate = vscode.window.createOutputChannel(name, { log: true });
  }
  get logLevel(): vscode.LogLevel {
    return this.delegate.logLevel;
  }
  get onDidChangeLogLevel(): vscode.Event<vscode.LogLevel> {
    return this.delegate.onDidChangeLogLevel;
  }
  trace(message: string, ...args: any[]): void {
    this.delegate.trace(message, ...args);
  }
  debug(message: string, ...args: any[]): void {
    this.delegate.debug(message, ...args);
  }
  info(message: string, ...args: any[]): void {
    this.delegate.info(message, ...args);
  }
  warn(message: string, ...args: any[]): void {
    this.delegate.warn(message, ...args);
  }
  error(error: string | Error, ...args: any[]): void {
    this.delegate.error(error, ...args);
  }
  get name(): string {
    return this.delegate.name;
  }
  replace(value: string): void {
    this.delegate.replace(value);
  }
  clear(): void {
    this.delegate.clear();
  }
  show(preserveFocus?: boolean | undefined): void;
  show(column?: vscode.ViewColumn | undefined, preserveFocus?: boolean | undefined): void;
  show(column?: unknown, preserveFocus?: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.delegate.show(column as any, preserveFocus as any);
  }
  hide(): void {
    this.delegate.hide();
  }
  dispose(): void {
    this.delegate.dispose();
  }

  append(value: string): void {
    this.logToDelegate(value);
  }
  appendLine(value: string): void {
    this.logToDelegate(value);
  }

  private preLevel: "trace" | "debug" | "info" | "warning" | "error" | "" = "";
  private logToDelegate(value: string) {
    if (TRACE_PREFIX.test(value)) {
      this.preLevel = "trace";
      this.delegate.trace(value.replace(TRACE_PREFIX, ""));
    } else if (DEBUG_PREFIX.test(value)) {
      this.preLevel = "debug";
      this.delegate.debug(value.replace(DEBUG_PREFIX, ""));
    } else if (INFO_PREFIX.test(value)) {
      this.preLevel = "info";
      this.delegate.info(value.replace(INFO_PREFIX, ""));
    } else if (WARN_PREFIX.test(value)) {
      this.preLevel = "warning";
      this.delegate.warn(value.replace(WARN_PREFIX, ""));
    } else if (ERROR_PREFIX.test(value)) {
      this.preLevel = "error";
      this.delegate.error(value.replace(ERROR_PREFIX, ""));
    } else {
      // a msg sent without a level prefix should be because a message is sent by calling multiple appendLine()
      // so just log it with the previous level
      switch (this.preLevel) {
        case "trace":
          this.delegate.trace(value);
          break;
        case "debug":
          this.delegate.debug(value);
          break;
        case "info":
          this.delegate.info(value);
          break;
        case "warning":
          this.delegate.warn(value);
          break;
        case "error":
          this.delegate.error(value);
          break;
        default:
          this.delegate.debug(
            `Log Message with invalid log level (${this.preLevel}). Raw message: ${value}`,
          );
      }
    }
  }
}
