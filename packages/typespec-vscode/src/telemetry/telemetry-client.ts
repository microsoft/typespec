import TelemetryReporter from "@vscode/extension-telemetry";
import pkgJson from "../../package.json" assert { type: "json" };
import logger from "../log/logger.js";
import { ResultCode } from "../types.js";
import { isWhitespaceStringOrUndefined } from "../utils.js";
import {
  emptyActivityId,
  generateActivityId,
  OperationDetailPropertyName,
  OperationTelemetryEvent,
  TelemetryEventName,
} from "./telemetry-event.js";

class TelemetryClient {
  private _client: TelemetryReporter.default | undefined;
  // The maximum number of telemetry error to log to avoid too much noise from it when
  // the telemetry doesn't work for some reason
  private readonly MAX_LOG_TELEMETRY_ERROR = 5;
  private _logTelemetryErrorCount = 0;

  constructor() {
    this._client = new (TelemetryReporter as any)(this.getConnectionString());
  }

  private getConnectionString() {
    return `InstrumentationKey=${pkgJson.telemetryKey}`;
  }

  public async flush() {
    // flush function is not exposed by the telemetry client, so we leverage dispose to trigger the flush and recreate the client
    await this._client?.dispose();
    this._client = new (TelemetryReporter as any)(this.getConnectionString());
  }

  private sendEvent(
    eventName: string,
    properties?: { [key: string]: string },
    measurements?: { [key: string]: number },
  ): void {
    try {
      this._client?.sendTelemetryEvent(eventName, properties, measurements);
    } catch (e) {
      this.logErrorWhenLoggingTelemetry(e);
    }
  }

  private sendErrorEvent(
    eventName: string,
    properties?: { [key: string]: string },
    measurements?: { [key: string]: number },
  ): void {
    try {
      this._client?.sendTelemetryErrorEvent(eventName, properties, measurements);
    } catch (e) {
      this.logErrorWhenLoggingTelemetry(e);
    }
  }

  public async doOperationWithTelemetry<T>(
    eventName: TelemetryEventName,
    /**
     * The result will be set automatically if the return type is ResultCode or Result<T>
     * Otherwise, you can set the result manually by setting the opTelemetryEvent.result
     */
    operation: (
      opTelemetryEvent: OperationTelemetryEvent,
      /** Call this function to send the telemetry event if you don't want to wait until the end of the operation for some reason*/
      sendTelemetryEvent: (result: ResultCode) => void,
    ) => Promise<T>,
    activityId?: string,
  ): Promise<T> {
    const opTelemetryEvent = this.createOperationTelemetryEvent(eventName, activityId);
    let eventSent = false;
    const sendTelemetryEvent = (result?: ResultCode) => {
      if (!eventSent) {
        eventSent = true;
        opTelemetryEvent.endTime ??= new Date();
        if (result) {
          opTelemetryEvent.result = result;
        }
        this.logOperationTelemetryEvent(opTelemetryEvent);
      }
    };
    try {
      const result = await operation(opTelemetryEvent, (result) => sendTelemetryEvent(result));
      if (result) {
        const isResultCode = (v: any) => Object.values(ResultCode).includes(v as ResultCode);
        if (isResultCode(result)) {
          opTelemetryEvent.result ??= result as ResultCode;
        } else if (typeof result === "object" && "code" in result && isResultCode(result.code)) {
          opTelemetryEvent.result ??= result.code as ResultCode;
        }
      }
      return result;
    } finally {
      sendTelemetryEvent();
    }
  }

  public logOperationTelemetryEvent(event: OperationTelemetryEvent) {
    const telFunc =
      event.result === "success" || event.result === "cancelled"
        ? this.sendEvent
        : this.sendErrorEvent;
    telFunc.call(this, event.eventName, {
      activityId: isWhitespaceStringOrUndefined(event.activityId)
        ? emptyActivityId
        : event.activityId!,
      // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
      startTime: event.startTime.toISOString(),
      endTime: event.endTime?.toISOString() ?? "",
      lastStep: event.lastStep ?? "undefined",
      result: event.result ?? "undefined",
    });
  }

  public logOperationDetailTelemetry(
    activityId: string,
    detail: Partial<Record<keyof typeof OperationDetailPropertyName, string>>,
  ) {
    const data = {
      activityId: activityId,
      ...detail,
    };

    if (detail.error !== undefined) {
      this.sendErrorEvent(TelemetryEventName.OperationDetail, {
        ...data,
      });
    } else {
      this.sendEvent(TelemetryEventName.OperationDetail, {
        ...data,
      });
    }
  }

  /**
   * Create a operation telemetry event with following default values.
   * Please make sure the default values are updated properly as needed
   *     activityId: a new random guid will be generated if not provided
   *     eventName: the event name provided
   *     startTime: set to the current time
   *     endTime: undefined
   *     result: undefined
   *     lastStep: undefined
   */
  private createOperationTelemetryEvent(
    eventName: TelemetryEventName,
    activityId?: string,
  ): OperationTelemetryEvent {
    return {
      activityId: isWhitespaceStringOrUndefined(activityId) ? generateActivityId() : activityId!,
      eventName: eventName,
      startTime: new Date(),
      endTime: undefined,
      result: undefined,
      lastStep: undefined,
    };
  }

  private logErrorWhenLoggingTelemetry(error: any) {
    if (this._logTelemetryErrorCount++ < this.MAX_LOG_TELEMETRY_ERROR) {
      logger.error("Failed to log telemetry event\n", [error]);
    }
    if (this._logTelemetryErrorCount === this.MAX_LOG_TELEMETRY_ERROR) {
      logger.error(
        `Failed to log telemetry event more than ${this.MAX_LOG_TELEMETRY_ERROR} times, will stop logging more error`,
      );
    }
  }

  async dispose() {
    await this._client?.dispose();
  }
}

const telemetryClient = new TelemetryClient();
export default telemetryClient;
