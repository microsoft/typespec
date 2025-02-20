import TelemetryReporter from "@vscode/extension-telemetry";
import pkgJson from "../../package.json" assert { type: "json" };
import logger from "../log/logger.js";
import { ResultCode } from "../types.js";
import { isWhitespaceStringOrUndefined } from "../utils.js";
import {
  createOperationTelemetryEvent,
  emptyActivityId,
  OperationDetailProperties,
  OperationDetailTelemetryEvent,
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
    operation: (
      opTelemetryEvent: OperationTelemetryEvent,
      /**
       * Call this function to send the telemetry event if you don't want to wait until the end of the operation for some reason
       */
      sendTelemetryEvent: (result: ResultCode) => void,
    ) => Promise<T>,
    activityId?: string,
  ): Promise<T> {
    const opTelemetryEvent = createOperationTelemetryEvent(eventName, activityId);
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
      const isResultCode = (v: any) => Object.values(ResultCode).includes(v as ResultCode);
      if (result) {
        if (isResultCode(result)) {
          // TODO: test
          opTelemetryEvent.result ??= result as ResultCode;
        } else if (typeof result === "object" && "code" in result && isResultCode(result.code)) {
          // TODO: test
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
    detail: Partial<Record<keyof OperationDetailProperties, string>>,
  ) {
    const data: OperationDetailTelemetryEvent = {
      activityId: activityId,
      eventName: TelemetryEventName.OperationDetail,
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
   * Use this method to send error to telemetry.
   * IMPORTANT: make sure to:
   *   - Collect as *little* telemetry as possible.
   *   - Do not include any personal or sensitive information.
   * Detail guidance can be found at: https://code.visualstudio.com/api/extension-guides/telemetry
   */
  // public logError(error: string, activityId?: string) {
  //   this.sendErrorEvent(TelemetryEventName.Error, {
  //     activityId: isWhitespaceStringOrUndefined(activityId) ? emptyActivityId : activityId!,
  //     timestamp: new Date().toISOString(),
  //     error: error,
  //   });
  // }

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
