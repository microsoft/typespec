type LogLevel = "info" | "warn" | "error" | "debug" | "trace";

export interface LogOptions {
  /** show the Output window in vscode */
  showOutput: boolean;
  /** show the log in vscode popup */
  showPopup: boolean;
}

export interface LogItem {
  message: string;
  level: LogLevel;
  details?: any[];
  options?: LogOptions;
}

export interface LogListener {
  Log(item: LogItem): void;
}

export class Logger {
  private _listeners: Map<string, LogListener> = new Map<string, LogListener>();

  private logInternal(item: LogItem) {
    this._listeners.forEach((listener) => {
      listener.Log(item);
    });
  }

  registerLogListener(name: string, listener: LogListener) {
    this._listeners.set(name, listener);
  }

  unregisterLogListener(name: string) {
    this._listeners.delete(name);
  }

  error(message: string, details?: any[], options?: LogOptions): void {
    this.logInternal({ message, level: "error", details, options });
  }

  trace(message: string, details?: any[], options?: LogOptions): void {
    this.logInternal({ message, level: "trace", details, options });
  }

  debug(message: string, details?: any[], options?: LogOptions): void {
    this.logInternal({ message, level: "debug", details, options });
  }

  info(message: string, details?: any[], options?: LogOptions): void {
    this.logInternal({ message, level: "info", details, options });
  }

  warning(message: string, details?: any[], options?: LogOptions): void {
    this.logInternal({ message, level: "warn", details, options });
  }

  async profile<T>(actionName: string, action: () => Promise<T>) {
    const start = Date.now();
    try {
      return await action();
    } finally {
      const end = Date.now();
      const elapsed = end - start;
      this.trace(`${actionName} took ${elapsed}ms`);
    }
  }
}

const logger = new Logger();
export default logger;
