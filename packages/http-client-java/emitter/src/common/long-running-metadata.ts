import type { Metadata, Schema } from "./schemas/model.js";

/**
 * Server-issued LRO operation ID sources selected by `@lroOperationId`.
 * The polling URL path parameter is used until the status-monitor body property is available.
 */
export interface LongRunningOperationIdMetadata {
  /** Route template of the status-monitor operation, used to extract the path parameter from the polling URL. */
  pathTemplate?: string;
  /** Name of the path parameter in "pathTemplate". */
  pathParameterSerializedName?: string;
  /** Serialized name of the status-monitor response property. */
  propertySerializedName?: string;
}

export interface LongRunningMetadata {
  longRunning: boolean;
  pollResultType?: Schema;
  finalResultType?: Schema;
  pollingStrategy?: Metadata;
  finalResultPropertySerializedName?: string;
  operationId?: LongRunningOperationIdMetadata;
}

export function createLongRunningMetadata(
  longRunning: boolean,
  pollResultType?: Schema,
  finalResultType?: Schema,
  pollingStrategy?: Metadata,
  finalResultPropertySerializedName?: string,
  operationId?: LongRunningOperationIdMetadata,
): LongRunningMetadata {
  return {
    longRunning,
    pollResultType,
    finalResultType,
    pollingStrategy,
    finalResultPropertySerializedName,
    operationId,
  };
}
