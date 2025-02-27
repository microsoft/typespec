// noop logger shouldn't be used in browser

import { LogSink, ProcessedLog } from "../types.js";

export function createConsoleSink(options: any): LogSink {
  function log(data: ProcessedLog) {
    // eslint-disable-next-line no-console
    console.log(formatLog(data));
  }

  return {
    log,
    trackAction: (action, log, completedLog) => trackAction(action, log, completedLog),
  };
}

export function formatLog(log: ProcessedLog): string {
  return JSON.stringify(log);
}

async function trackAction<T>(
  asyncAction: () => Promise<T>,
  log: string,
  completedLog: string,
): Promise<T> {
  // eslint-disable-next-line no-console
  console.log(log);

  try {
    return await asyncAction();
  } finally {
    // eslint-disable-next-line no-console
    console.log(`✓ ${completedLog}`);
  }
}
