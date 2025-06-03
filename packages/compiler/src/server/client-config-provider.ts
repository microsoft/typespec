import { Connection, DidChangeConfigurationNotification } from "vscode-languageserver/node.js";
import { ServerHost } from "./types.js";

/**
 * TypeSpec client-side configuration settings
 */
export interface ClientConfigProvider {
  getConfiguration(): string[] | undefined;
  updateClientConfigs(configs: { lsp: { emit: string[] | undefined } }): void;
  initialClientConfig(connection: Connection, host: ServerHost): Promise<void>;
}

export function createClientConfigProvider(): ClientConfigProvider {
  let clientConfiguration: { lsp: { emit: string[] | undefined } } | undefined;
  return { getConfiguration, updateClientConfigs, initialClientConfig };

  function getConfiguration(): string[] | undefined {
    if (clientConfiguration && clientConfiguration.lsp) {
      const emit = clientConfiguration.lsp.emit;
      if (Array.isArray(emit)) {
        return emit;
      }
    }
    return undefined;
  }

  function updateClientConfigs(configs: { lsp: { emit: string[] | undefined } }): void {
    clientConfiguration = configs;
  }

  async function initialClientConfig(connection: Connection, host: ServerHost): Promise<void> {
    try {
      await connection.client.register(DidChangeConfigurationNotification.type, undefined);
      const configs = await connection.workspace.getConfiguration("typespec");
      host.log({ level: "debug", message: "Vscode settings loaded", detail: configs });

      clientConfiguration = configs;
    } catch (error) {
      host.log({
        level: "error",
        message: "An error occurred while loading the vscode settings",
        detail: error,
      });
    }
  }
}
