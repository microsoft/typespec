import { Connection, DidChangeConfigurationNotification } from "vscode-languageserver/node.js";
import { ServerHost } from "./types.js";

/**
 * TypeSpec configuration settings
 */
export interface VsCodeSettings {
  /**
   * VSCode extended configuration
   */
  vscodeSettings: Record<string, any>;

  /**
   * Get the value of the specified configuration item
   * @param key Configuration item key name
   * @returns Configure value, if it does not exist, return undefined
   */
  getSetting<T>(key: string): T | undefined;
}

let globalVsCodeSettings: VsCodeSettings | undefined;

/**
 * Initialize vscode settings
 * @param connection {@link Connection} connect object
 * @param host {@link ServerHost} ServerHost object
 * @returns {@link VsCodeSettings} vscode setting object
 */
export async function initializeVsCodeSettings(
  connection: Connection,
  host: ServerHost,
): Promise<VsCodeSettings> {
  try {
    await connection.client.register(DidChangeConfigurationNotification.type, undefined);
    const vscodeSettings = await connection.workspace.getConfiguration("typespec");
    host.log({ level: "debug", message: "Vscode settings loaded", detail: vscodeSettings });

    globalVsCodeSettings = {
      vscodeSettings: vscodeSettings || {},

      getSetting<T>(key: string): T | undefined {
        return this.vscodeSettings[key] as T | undefined;
      },
    };

    return globalVsCodeSettings;
  } catch (error) {
    host.log({
      level: "error",
      message: "An error occurred while loading the vscode settings",
      detail: error,
    });
    // Return to the empty setting object
    return {
      vscodeSettings: {},
      getSetting<T>(_key: string): T | undefined {
        return undefined;
      },
    };
  }
}

/**
 * Get vscode settings
 * If the setting has not been initialized, an empty setting object will be returned
 */
export function getVsCodeSettings(): VsCodeSettings {
  if (!globalVsCodeSettings) {
    globalVsCodeSettings = {
      vscodeSettings: {},
      getSetting<T>(_key: string): T | undefined {
        return undefined;
      },
    };
  }

  return globalVsCodeSettings;
}

/**
 * Update vscode settings
 * @param settings New settings
 */
export function updateVsCodeSettings(settings: Record<string, any>): void {
  if (globalVsCodeSettings) {
    globalVsCodeSettings.vscodeSettings = settings || {};
  }
}
