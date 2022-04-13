// noop logger shouldn't be used in browser

import { ProcessedLog } from "./types.js";

export function formatLog(log: ProcessedLog): string {
  return JSON.stringify(log);
}
export function createLogger() {
  return {};
}
