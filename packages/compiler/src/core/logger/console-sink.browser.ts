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
    trackAction: (action, log) => trackAction(action, log),
  };
}

export function formatLog(log: ProcessedLog): string {
  return JSON.stringify(log);
}

async function trackAction<T>(asyncAction: () => Promise<T>, log: ProcessedLog): Promise<T> {
  // eslint-disable-next-line no-console
  console.log(log.message);

  try {
    return await asyncAction();
  } finally {
    const childLogs = getChildLogs();
    // eslint-disable-next-line no-console
    childLogs.forEach((message) => console.log(message));
  }
}
