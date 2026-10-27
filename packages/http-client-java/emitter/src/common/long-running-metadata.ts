import type { Metadata, Schema } from "./schemas/model.js";

export interface LongRunningMetadata {
  longRunning: boolean;
  pollResultType?: Schema;
  finalResultType?: Schema;
  pollingStrategy?: Metadata;
  finalResultPropertySerializedName?: string;
}

export function createLongRunningMetadata(
  longRunning: boolean,
  pollResultType?: Schema,
  finalResultType?: Schema,
  pollingStrategy?: Metadata,
  finalResultPropertySerializedName?: string,
): LongRunningMetadata {
  return {
    longRunning,
    pollResultType,
    finalResultType,
    pollingStrategy,
    finalResultPropertySerializedName,
  };
}
