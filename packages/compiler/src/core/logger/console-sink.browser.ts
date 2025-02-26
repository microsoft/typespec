// noop logger shouldn't be used in browser
import { getChildLogs } from "../helpers/logger-child-utils.js";

import { LogSink, ProcessedLog } from "../types.js";

export function createConsoleSink(options: any): LogSink {
  function log(data: ProcessedLog) {
    // eslint-disable-next-line no-console
    console.log(formatLog(data));
  }

  return {
    log,
    trackAction: (action, startLog, logChildLogs, endLog) =>
      trackAction(action, startLog, logChildLogs, endLog),
  };
}

export function formatLog(log: ProcessedLog): string {
  return JSON.stringify(log);
}

async function trackAction<T>(
  asyncAction: () => Promise<T>,
  startLog: ProcessedLog,
  logChildLogs: boolean = false,
  endLog?: ProcessedLog,
): Promise<T> {
  // eslint-disable-next-line no-console
  console.log(startLog.message);

  try {
    return await asyncAction();
  } finally {
    if (endLog) {
      // eslint-disable-next-line no-console
      console.log(endLog.message);
    }
    if (logChildLogs) {
      const childLogs = getChildLogs();
      // eslint-disable-next-line no-console
      childLogs.forEach((message) => console.log(message));
    }
  }
}
