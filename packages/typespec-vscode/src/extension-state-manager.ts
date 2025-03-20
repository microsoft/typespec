import { LogLevel } from "rollup";
import vscode from "vscode";
import { normalizePath } from "./path-utils.js";
import { RawTelemetryEvent } from "./telemetry/telemetry-event.js";

export interface StartUpMessage {
  /**
   * the message to show in the popup notification
   */
  popupMessage: string;
  /**
   * the detail logged to the Output window
   */
  detail: string;
  /**
   * the level used to show notification and log
   */
  level: LogLevel;
}

interface DelayedTelemetryEvent {
  raw: RawTelemetryEvent;
  isError: boolean;
}

/** manage data stored in vscode extension's state (ExtensionContext.globalState/workspaceState) */
export class ExtensionStateManager {
  constructor(private vscodeContext: vscode.ExtensionContext) {}

  private getValue<T>(key: string, defaultValue: T, isGlobal: boolean): T {
    return isGlobal
      ? this.vscodeContext.globalState.get(key, defaultValue)
      : this.vscodeContext.workspaceState.get(key, defaultValue);
  }

  /**
   *
   * @param key
   * @param value must be JSON stringifyable, set to undefined to delete the key
   * @param isGlobal
   */
  private setValue<T>(key: string, value: T | undefined, isGlobal: boolean) {
    isGlobal
      ? this.vscodeContext.globalState.update(key, value)
      : this.vscodeContext.workspaceState.update(key, value);
  }

  private getStartUpMessageKey(workspaceFolder: string) {
    const ON_START_UP_MESSAGE_KEY_PREFIX = "onStartUpMessage-";
    const path = normalizePath(workspaceFolder);
    return `${ON_START_UP_MESSAGE_KEY_PREFIX}${path}`;
  }

  saveStartUpMessage(msg: StartUpMessage, workspaceFolder: string) {
    const key = this.getStartUpMessageKey(workspaceFolder);
    this.setValue(key, msg, true);
  }
  loadStartUpMessage(workspaceFolder: string): StartUpMessage | undefined {
    const key = this.getStartUpMessageKey(workspaceFolder);
    const value = this.getValue<StartUpMessage | undefined>(key, undefined, true);
    return value;
  }
  cleanUpStartUpMessage(workspaceFolder: string) {
    const key = this.getStartUpMessageKey(workspaceFolder);
    this.setValue(key, undefined, true);
  }

  private TELEMETRY_DELAYED_EVENT_KEY: string = "telemetry-delayed-event";
  pushDelayedTelemetryEvent(raw: RawTelemetryEvent, isError: boolean) {
    const existing = this.getValue<DelayedTelemetryEvent[]>(
      this.TELEMETRY_DELAYED_EVENT_KEY,
      [],
      true,
    );
    this.setValue<DelayedTelemetryEvent[]>(
      this.TELEMETRY_DELAYED_EVENT_KEY,
      [
        ...existing,
        {
          raw,
          isError,
        },
      ],
      true,
    );
  }
  loadDelayedTelemetryEvents(): DelayedTelemetryEvent[] {
    return this.getValue<DelayedTelemetryEvent[]>(this.TELEMETRY_DELAYED_EVENT_KEY, [], true);
  }
  cleanUpDelayedTelemetryEvents() {
    this.setValue(this.TELEMETRY_DELAYED_EVENT_KEY, [], true);
  }
}
