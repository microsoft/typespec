import { Connection } from "vscode-languageserver/node.js";
import { deepClone } from "../utils/misc.js";
import { ServerHost } from "./types.js";

interface LSPConfig {
  emit?: string[];
}

export interface Config {
  lsp?: LSPConfig;
  entrypoint?: string[];
}

/**
 * TypeSpec client-side configuration provider
 * Inspired by VS Code's WorkspaceConfiguration API for extensibility
 */
export interface ClientConfigProvider {
  /**
   * Initialize client configuration with connection and host
   * @param connection Language server connection
   * @param host Server host instance
   */
  initialize(connection: Connection, host: ServerHost): Promise<void>;

  config?: Config;
}

export function createClientConfigProvider(): ClientConfigProvider {
  let config: Config | undefined;

  async function initialize(connection: Connection, host: ServerHost): Promise<void> {
    try {
      const configs = await connection.workspace.getConfiguration("typespec");
      // Transform the raw configuration to match our Config interface
      config = deepClone(configs);

      host.log({ level: "debug", message: "vscode settings loaded", detail: config });

      connection.onDidChangeConfiguration(async (params) => {
        if (params.settings) {
          const newConfigs = params.settings?.typespec;
          config = deepClone(newConfigs);
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
    initialize,
    get config() {
      return config;
    },
  };
}
