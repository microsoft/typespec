import { Connection, DidChangeConfigurationNotification } from "vscode-languageserver/node.js";
import { ServerHost } from "./types.js";

/**
 * Represents configuration value with additional metadata
 */
export interface ConfigurationValue<T = any> {
  /** The configuration value */
  value: T;
  /** The scope where this value was defined (global, workspace, etc.) */
  scope?: "default" | "global" | "workspace" | "workspaceFolder";
  /** Language specific configuration if applicable */
  languageId?: string;
}

/**
 * TypeSpec client-side configuration provider
 * Inspired by VS Code's WorkspaceConfiguration API for extensibility
 */
export interface ClientConfigProvider {
  /**
   * Get a configuration value by section key
   * @param section The configuration section (e.g., "lsp.emit", "formatting.enabled")
   * @param defaultValue Default value if not found
   * @returns The configuration value or default
   */
  get<T>(section: string): T | undefined;
  get<T>(section: string, defaultValue: T): T;

  /**
   * Check if a configuration section exists
   * @param section The configuration section
   * @returns True if the section exists
   */
  has(section: string): boolean;

  /**
   * Get detailed information about a configuration value
   * @param section The configuration section
   * @returns Detailed configuration information
   */
  inspect<T>(section: string): ConfigurationValue<T> | undefined;

  /**
   * Update the entire configuration
   * @param configs The new configuration object
   */
  update(configs: Record<string, any>): void;

  /**
   * Initialize client configuration with connection and host
   * @param connection Language server connection
   * @param host Server host instance
   */
  initialize(connection: Connection, host: ServerHost): Promise<void>;
}

export function createClientConfigProvider(): ClientConfigProvider {
  let configuration: Record<string, any> = {};

  function get<T>(section: string): T | undefined;
  function get<T>(section: string, defaultValue: T): T;
  function get<T>(section: string, defaultValue?: T): T | undefined {
    const keys = section.split(".");
    let current: any = configuration;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current !== undefined ? current : defaultValue;
  }

  function has(section: string): boolean {
    const keys = section.split(".");
    let current: any = configuration;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }

    return current !== undefined;
  }

  function inspect<T>(section: string): ConfigurationValue<T> | undefined {
    if (!has(section)) {
      return undefined;
    }

    const value = get<T>(section);
    return {
      value: value as T, // Safe cast since we know it exists from has() check
      scope: "workspace", // Default scope, could be enhanced to track actual scope
    };
  }

  function update(configs: Record<string, any>): void {
    configuration = { ...configs };
  }

  async function initialize(connection: Connection, host: ServerHost): Promise<void> {
    try {
      await connection.client.register(DidChangeConfigurationNotification.type, undefined);
      const configs = await connection.workspace.getConfiguration("typespec");
      host.log({ level: "debug", message: "VSCode settings loaded", detail: configs });

      update(configs);

      connection.onDidChangeConfiguration(async (params) => {
        if (params.settings && params.settings.typespec) {
          update(params.settings.typespec);
        }

        host.log({ level: "debug", message: "Configuration changed", detail: params.settings });
      });
    } catch (error) {
      host.log({
        level: "error",
        message: "An error occurred while loading the VSCode settings",
        detail: error,
      });
    }
  }

  return {
    get,
    has,
    inspect,
    update,
    initialize,
  };
}
