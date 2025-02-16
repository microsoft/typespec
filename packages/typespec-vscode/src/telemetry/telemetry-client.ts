import TelemetryReporter from "@vscode/extension-telemetry";
import pkgJson from "../../package.json" assert { type: "json" };
import logger from "../log/logger.js";
import { Result } from "../types.js";
import { isWhitespaceStringOrUndefined } from "../utils.js";
import {
  createOperationTelemetryEvent,
  emptyActivityId,
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
    const cs = `InstrumentationKey=${pkgJson.telemetryKey}`;
    this._client = new (TelemetryReporter as any)(cs);
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
    operation: (opTelemetryEvent: OperationTelemetryEvent) => Promise<Result<T>>,
    activityId?: string,
  ): Promise<Result<T>> {
    const opTelemetryEvent = createOperationTelemetryEvent(eventName, activityId);
    try {
      const result = await operation(opTelemetryEvent);
      opTelemetryEvent.result ??= result.code;
      return result;
    } finally {
      opTelemetryEvent.endTime ??= new Date();
      this.logOperationTelemetryEvent(opTelemetryEvent);
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

  /**
   * Use this method to send log to telemetry.
   * IMPORTANT: make sure to:
   *   - Collect as *little* telemetry as possible.
   *   - Do not include any personal or sensitive information.
   * Detail guidance can be found at: https://code.visualstudio.com/api/extension-guides/telemetry
   * @param level
   * @param message
   * @param activityId
   */
  public log(level: "error", message: string, activityId?: string) {
    const telFunc = level === "error" ? this.sendErrorEvent : this.sendEvent;
    telFunc.call(this, TelemetryEventName.Log, {
      activityId: isWhitespaceStringOrUndefined(activityId) ? emptyActivityId : activityId!,
      level: level,
      message: message,
    });
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
