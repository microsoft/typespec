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
  append(value: string): void {
    this.delegate.append(value);
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
    // eslint-disable-next-line deprecation/deprecation
    this.delegate.show(column as any, preserveFocus as any);
  }
  hide(): void {
    this.delegate.hide();
  }
  dispose(): void {
    this.delegate.dispose();
  }

  appendLine(value: string): void {
    if (TRACE_PREFIX.test(value)) {
      this.delegate.trace(value.replace(TRACE_PREFIX, ""));
    } else if (DEBUG_PREFIX.test(value)) {
      this.delegate.debug(value.replace(DEBUG_PREFIX, ""));
    } else if (INFO_PREFIX.test(value)) {
      this.delegate.info(value.replace(INFO_PREFIX, ""));
    } else if (WARN_PREFIX.test(value)) {
      this.delegate.warn(value.replace(WARN_PREFIX, ""));
    } else if (ERROR_PREFIX.test(value)) {
      this.delegate.error(value.replace(ERROR_PREFIX, ""));
    } else {
      this.delegate.info(value);
    }
  }
}
