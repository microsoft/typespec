import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  ClientConfigProvider,
  createClientConfigProvider,
} from "../../src/server/client-config-provider.js";

describe("compiler: server: client-config-provider", () => {
  let configProvider: ClientConfigProvider;

  beforeEach(() => {
    // Create a new client config provider before each test
    configProvider = createClientConfigProvider();
  });

  it("returns empty configuration when not initialized", () => {
    const configs = configProvider.getConfiguration();

    // Check if the property exists and is empty
    strictEqual(typeof configs, "undefined");
    strictEqual(configs, undefined);
  });

  it("should update and get configuration correctly", () => {
    const testConfig = { lsp: { emit: ["openapi3", "json-schema"] } };

    configProvider.updateClientConfigs(testConfig);
    const retrievedConfig = configProvider.getConfiguration();

    strictEqual(Array.isArray(retrievedConfig), true);
    strictEqual(retrievedConfig?.length, 2);
    strictEqual(retrievedConfig?.[0], "openapi3");
    strictEqual(retrievedConfig?.[1], "json-schema");
  });

  it("should handle empty emit array", () => {
    const testConfig = { lsp: { emit: [] } };

    configProvider.updateClientConfigs(testConfig);
    const retrievedConfig = configProvider.getConfiguration();

    strictEqual(Array.isArray(retrievedConfig), true);
    strictEqual(retrievedConfig?.length, 0);
  });

  it("should handle undefined emit configuration", () => {
    const testConfig = { lsp: { emit: undefined } };

    configProvider.updateClientConfigs(testConfig);
    const retrievedConfig = configProvider.getConfiguration();

    strictEqual(retrievedConfig, undefined);
  });

  it("should handle single emit value", () => {
    const testConfig = { lsp: { emit: ["openapi3"] } };

    configProvider.updateClientConfigs(testConfig);
    const retrievedConfig = configProvider.getConfiguration();

    strictEqual(Array.isArray(retrievedConfig), true);
    strictEqual(retrievedConfig?.length, 1);
    strictEqual(retrievedConfig?.[0], "openapi3");
  });

  it("should update existing configuration", () => {
    const initialConfig = { lsp: { emit: ["openapi3"] } };
    const updatedConfig = { lsp: { emit: ["json-schema", "yaml"] } };

    configProvider.updateClientConfigs(initialConfig);
    configProvider.updateClientConfigs(updatedConfig);

    const finalConfig = configProvider.getConfiguration();

    strictEqual(Array.isArray(finalConfig), true);
    strictEqual(finalConfig?.length, 2);
    strictEqual(finalConfig?.[0], "json-schema");
    strictEqual(finalConfig?.[1], "yaml");
  });

  it("should persist configuration between get calls", () => {
    const testConfig = { lsp: { emit: ["openapi3", "json-schema"] } };

    configProvider.updateClientConfigs(testConfig);

    // Multiple calls should return the same configuration
    const config1 = configProvider.getConfiguration();
    const config2 = configProvider.getConfiguration();

    strictEqual(JSON.stringify(config1), JSON.stringify(config2));
    strictEqual(config1?.length, 2);
    strictEqual(config2?.length, 2);
  });
});
