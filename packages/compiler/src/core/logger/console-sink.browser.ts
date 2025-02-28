// noop logger shouldn't be used in browser

import { LogSink, ProcessedLog } from "../types.js";

export function createConsoleSink(options: any): LogSink {
  function log(data: ProcessedLog) {
    // eslint-disable-next-line no-console
    console.log(formatLog(data));
  }

  return {
    log,
    trackAction: (message, finalMessage, action) => trackAction(message, finalMessage, action),
  };
}

export function formatLog(log: ProcessedLog): string {
  return JSON.stringify(log);
}

async function trackAction<T>(
  message: string,
  finalMessage: string,
  asyncAction: () => Promise<T>,
): Promise<T> {
  // eslint-disable-next-line no-console
  console.log(message);

  try {
    const result = await asyncAction();
    // eslint-disable-next-line no-console
    console.log(`✓ ${finalMessage}`);
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`x ${message}`);
    throw error;
  }
}
