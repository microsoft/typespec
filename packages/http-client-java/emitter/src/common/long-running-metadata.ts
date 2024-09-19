import { Metadata, Schema } from "@autorest/codemodel";

export class LongRunningMetadata {
  longRunning: boolean = false;
  pollResultType?: Schema;
  finalResultType?: Schema;
  pollingStrategy?: Metadata;
  finalResultPropertySerializedName?: string;

  constructor(
    longRunning: boolean,
    pollResultType?: Schema,
    finalResultType?: Schema,
    pollingStrategy?: Metadata,
    finalResultPropertySerializedName?: string,
  ) {
    this.longRunning = longRunning;
    this.pollResultType = pollResultType;
    this.finalResultType = finalResultType;
    this.pollingStrategy = pollingStrategy;
    this.finalResultPropertySerializedName = finalResultPropertySerializedName;
  }
}
