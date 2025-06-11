import { Connection } from "vscode-languageserver/node.js";
import { ServerHost } from "./types.js";

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

  function update(configs: Record<string, any>): void {
    configuration = { ...configs };
  }

  async function initialize(connection: Connection, host: ServerHost): Promise<void> {
    try {
      const configs = await connection.workspace.getConfiguration("typespec");
      const settings = { typespec: configs };
      host.log({ level: "debug", message: "VSCode settings loaded", detail: settings });

      update(settings);

      connection.onDidChangeConfiguration(async (params) => {
        if (params.settings) {
          update(params.settings);
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
    initialize,
  };
}
