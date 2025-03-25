import TelemetryReporter from "@vscode/extension-telemetry";
import { inspect } from "util";
import pkgJson from "../../package.json" with { type: "json" };
import { EmptyGuid } from "../const.js";
import { ExtensionStateManager } from "../extension-state-manager.js";
import logger from "../log/logger.js";
import { ResultCode } from "../types.js";
import { isWhitespaceStringOrUndefined } from "../utils.js";
import {
  emptyActivityId,
  generateActivityId,
  OperationDetailPropertyName,
  OperationTelemetryEvent,
  RawTelemetryEvent,
  TelemetryEventName,
} from "./telemetry-event.js";

export class TelemetryClient {
  private _client: TelemetryReporter.default | undefined;
  // The maximum number of telemetry error to log to avoid too much noise from it when
  // the telemetry doesn't work for some reason
  private readonly MAX_LOG_TELEMETRY_ERROR = 5;
  private _logTelemetryErrorCount = 0;
  private _stateManager: ExtensionStateManager | undefined;

  constructor() {}

  /**
   *
   * @param stateManager the state manager to use for storing telemetry events which will been sent in delay (next time the extension starts) which
   * is useful when the extension will be re-initialized for some reason (i.e. open new window for created project) and can't send telemetry events in time.
   */
  public Initialize(stateManager: ExtensionStateManager) {
    this._stateManager = stateManager;
    this.initClient();
  }

  private initClient() {
    const key = this.getTelemetryKey();
    if (!key) {
      this.logErrorWhenLoggingTelemetry(
        "Skip initializing telemetry client because no telemetry key is provided",
      );
      this._client = undefined;
    } else {
      // has to convert the TelemetryReporter to any, otherwise it will report error: This expression is not constructable.
      this._client = new (TelemetryReporter as any)(key);
    }
  }

  private getTelemetryKey(): string | undefined {
    const isValidKey = (key: string | undefined) => key && key !== EmptyGuid;
    let key: string | undefined = pkgJson.telemetryKey;
    if (!isValidKey(key)) {
      logger.debug(
        "Telemetry key is not provided in package.json, try to use environment variable TYPESPEC_VSCODE_TELEMETRY_KEY",
      );
      key = process.env.TYPESPEC_VSCODE_TELEMETRY_KEY;
    }
    if (!isValidKey(key)) {
      logger.debug(
        "Telemetry key is not provided in package.json or environment variable TYPESPEC_VSCODE_TELEMETRY_KEY",
      );
      return undefined;
    }
    return key;
  }

  private sendEvent(raw: RawTelemetryEvent, delay: boolean): void {
    try {
      if (delay) {
        if (!this._stateManager) {
          this.logErrorWhenLoggingTelemetry(
            "Unable to sendEvent in delay mode because the state manager is not initialized",
          );
        } else {
          this._stateManager.pushDelayedTelemetryEvent(raw, false /*isError*/);
        }
      } else {
        this._client?.sendTelemetryEvent(raw.eventName, raw.properties, raw.measurements);
      }
    } catch (e) {
      this.logErrorWhenLoggingTelemetry(e);
    }
  }

  private sendErrorEvent(raw: RawTelemetryEvent, delay: boolean): void {
    try {
      if (delay) {
        if (!this._stateManager) {
          this.logErrorWhenLoggingTelemetry(
            "Unable to sendErrorEvent in delay mode because the state manager is not initialized",
          );
        } else {
          this._stateManager.pushDelayedTelemetryEvent(raw, true /*isError*/);
        }
      } else {
        this._client?.sendTelemetryErrorEvent(raw.eventName, raw.properties, raw.measurements);
      }
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
      sendTelemetryEvent: (result: ResultCode, delay: boolean) => void,
    ) => Promise<T>,
    activityId?: string,
  ): Promise<T> {
    const opTelemetryEvent = this.createOperationTelemetryEvent(eventName, activityId);
    let eventSent = false;
    const sendTelemetryEvent = (result?: ResultCode, delay: boolean = false) => {
      if (!eventSent) {
        eventSent = true;
        opTelemetryEvent.endTime ??= new Date();
        if (result) {
          opTelemetryEvent.result = result;
        }
        this.logOperationTelemetryEvent(opTelemetryEvent, delay);
      }
    };
    try {
      const result = await operation(opTelemetryEvent, (result, delay) =>
        sendTelemetryEvent(result, delay),
      );
      if (result) {
        const isResultCode = (v: any) => Object.values(ResultCode).includes(v as ResultCode);
        if (isResultCode(result)) {
          opTelemetryEvent.result ??= result as ResultCode;
        } else if (typeof result === "object" && "code" in result && isResultCode(result.code)) {
          opTelemetryEvent.result ??= result.code as ResultCode;
        }
      }
      return result;
    } catch (e) {
      this.logOperationDetailTelemetry(opTelemetryEvent.activityId, {
        error: "Unhandled exception from operation to doOperationWithTelemetry: \n" + inspect(e),
      });
      opTelemetryEvent.result = ResultCode.Fail;
      // just report the issue in telemetry and re-throw the error
      throw e;
    } finally {
      sendTelemetryEvent();
    }
  }

  public logOperationTelemetryEvent(event: OperationTelemetryEvent, delay: boolean = false) {
    const raw: RawTelemetryEvent = {
      eventName: event.eventName,
      properties: {
        activityId: isWhitespaceStringOrUndefined(event.activityId)
          ? emptyActivityId
          : event.activityId!,
        // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
        startTime: event.startTime.toISOString(),
        endTime: event.endTime?.toISOString() ?? "",
        lastStep: event.lastStep ?? "undefined",
        result: event.result ?? "undefined",
      },
    };
    if (event.result === "success" || event.result === "cancelled") {
      this.sendEvent(raw, delay);
    } else {
      this.sendErrorEvent(raw, delay);
    }
  }

  public logOperationDetailTelemetry(
    activityId: string,
    detail: Partial<Record<keyof typeof OperationDetailPropertyName, string>>,
    delay: boolean = false,
  ) {
    const data = {
      activityId: activityId,
      ...detail,
    };

    if (detail.error !== undefined) {
      this.sendErrorEvent(
        {
          eventName: TelemetryEventName.OperationDetail,
          properties: {
            ...data,
          },
        },
        delay,
      );
    } else {
      this.sendEvent(
        {
          eventName: TelemetryEventName.OperationDetail,
          properties: {
            ...data,
          },
        },
        delay,
      );
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

  sendDelayedTelemetryEvents() {
    if (!this._stateManager) {
      this.logErrorWhenLoggingTelemetry(
        "Failed to send delayed telemetry events because the state manager is not initialized",
      );
      return;
    }
    const events = this._stateManager.loadDelayedTelemetryEvents();
    events.forEach((event) => {
      if (event.isError) {
        this.sendErrorEvent(event.raw, false);
      } else {
        this.sendEvent(event.raw, false);
      }
    });
    this._stateManager.cleanUpDelayedTelemetryEvents();
    logger.info(`Sent ${events.length} delayed telemetry events`);
  }

  async dispose() {
    await this._client?.dispose();
  }
}

const telemetryClient = new TelemetryClient();
export default telemetryClient;
