import type { Connection } from "vscode-languageserver/node";
import type { ServerHost } from "./types.js";

/** Client settings that control which emitters run during language-server compilation. */
interface LSPConfig {
  /**
   * Emitter names overriding project configuration. Include `"<config:defaults>"` to retain
   * configured emitters and append the other names without duplicates. When absent, no
   * emitters run unless the compilation supplies an explicit emit option; core mode
   * suppresses emitters regardless of these settings.
   */
  emit?: string[];
}

/** TypeSpec client settings read by the server when resolving a compilation request. */
interface Config {
  /** Language-server-specific compiler settings; absent settings use server defaults. */
  lsp?: LSPConfig;
  /**
   * Ordered entry-point candidates checked in each directory during upward project discovery.
   * Defaults to `["main.tsp"]`; project tspconfig boundaries and package `tspMain` entries take precedence.
   */
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

  /** Current TypeSpec client settings, if available; read by the server for each compilation. */
  config?: Config;
}

export function createClientConfigProvider(): ClientConfigProvider {
  let config: Config | undefined;

  async function initialize(connection: Connection, host: ServerHost): Promise<void> {
    try {
      const configs = await connection.workspace.getConfiguration("typespec");
      // Transform the raw configuration to match our Config interface
      config = structuredClone(configs);

      host.log({ level: "debug", message: "vscode settings loaded", detail: config });

      connection.onDidChangeConfiguration(async (params) => {
        if (params.settings) {
          const newConfigs = params.settings?.typespec;
          config = structuredClone(newConfigs);
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
