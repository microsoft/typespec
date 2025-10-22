/* eslint-disable @typescript-eslint/no-explicit-any */

const logFilter = process.env["AZURE_LINTER_LOG_FILTER"] || "warning";
const logLevelArray = ["trace", "debug", "info", "warning", "error"];

const logFilterIndex = logLevelArray.indexOf(logFilter);

class Logger {
  info(message: string, ...args: any[]): void {
    if (logLevelArray.indexOf("info") < logFilterIndex) {
      return;
    }
    console.log(`[INFO] ${message}`, ...args);
  }

  warning(message: string, ...args: any[]): void {
    if (logLevelArray.indexOf("warning") < logFilterIndex) {
      return;
    }
    console.warn(`[WARNING] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    if (logLevelArray.indexOf("error") < logFilterIndex) {
      return;
    }
    console.error(`[ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (logLevelArray.indexOf("debug") < logFilterIndex) {
      return;
    }
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

export const logger = new Logger();
