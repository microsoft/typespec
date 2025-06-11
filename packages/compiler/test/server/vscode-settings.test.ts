import { strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
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

  describe("configuration API", () => {
    it("should return undefined when configuration is missing without default", () => {
      const result = configProvider.get("non.existent.key");
      strictEqual(result, undefined);
    });

    it("should return default value when configuration is missing", () => {
      const defaultValue = "default-value";
      const result = configProvider.get("non.existent.key", defaultValue);
      strictEqual(result, defaultValue);
    });

    it("should handle nested configuration keys", () => {
      // Since configuration starts empty, test with default values
      const result = configProvider.get("lsp.emit", ["default"]);
      strictEqual(result[0], "default");
    });

    it("should handle boolean configuration values", () => {
      const result = configProvider.get("formatting.enabled", false);
      strictEqual(result, false);
    });
  });

  describe("initialization and VS Code integration", () => {
    let mockHost: any;

    beforeEach(() => {
      mockHost = {
        log: vi.fn(),
      } as any;
    });

    it("should handle initialization with mock connection and host", async () => {
      // Create mock connection and host
      const mockConnection = {
        workspace: {
          getConfiguration: vi.fn().mockResolvedValue({
            lsp: { emit: ["openapi3"] },
            formatting: { enabled: true },
          }),
        },
        onDidChangeConfiguration: vi.fn(),
      } as any;

      await configProvider.initialize(mockConnection, mockHost);

      // Verify configuration was fetched and applied
      strictEqual(mockConnection.workspace.getConfiguration.mock.calls.length, 1);
      strictEqual(mockConnection.workspace.getConfiguration.mock.calls[0]?.[0], "typespec");

      // Verify configuration is now available - note that config is wrapped under 'typespec' key
      const lspEmit = configProvider.get<string[]>("typespec.lsp.emit");
      strictEqual(lspEmit?.[0], "openapi3");
      strictEqual(configProvider.get("typespec.formatting.enabled"), true);

      // Verify change handler was registered
      strictEqual(mockConnection.onDidChangeConfiguration.mock.calls.length, 1);

      // Verify logging - the detail should contain the wrapped settings
      strictEqual(mockHost.log.mock.calls.length, 1);
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.level, "debug");
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.message, "VSCode settings loaded");
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.detail?.typespec?.lsp?.emit?.[0], "openapi3");
    });

    it("should handle initialization errors gracefully", async () => {
      const mockConnection = {
        workspace: {
          getConfiguration: vi.fn().mockRejectedValue(new Error("Configuration fetch failed")),
        },
        onDidChangeConfiguration: vi.fn(),
      } as any;

      // Should not throw even if initialization fails
      await configProvider.initialize(mockConnection, mockHost);

      // Should have logged the error
      strictEqual(mockHost.log.mock.calls.length, 1);
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.level, "error");
      strictEqual(
        mockHost.log.mock.calls[0]?.[0]?.message,
        "An error occurred while loading the VSCode settings",
      );

      // Verify that the error details are logged
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.detail instanceof Error, true);
    });

    it("should handle configuration change notifications from VS Code", async () => {
      let onDidChangeHandler: any;

      const mockConnection = {
        workspace: {
          getConfiguration: vi.fn().mockResolvedValue({ initial: "config" }),
        },
        onDidChangeConfiguration: vi.fn().mockImplementation((handler) => {
          onDidChangeHandler = handler;
        }),
      } as any;

      await configProvider.initialize(mockConnection, mockHost);

      // Simulate a configuration change from VS Code
      const changeParams = {
        settings: {
          typespec: {
            lsp: { emit: ["updated"] },
            newSetting: "value",
          },
        },
      };

      await onDidChangeHandler(changeParams);

      // Verify configuration was updated - settings are updated directly
      const lspEmit = configProvider.get<string[]>("typespec.lsp.emit");
      strictEqual(lspEmit?.[0], "updated");
      strictEqual(configProvider.get("typespec.newSetting"), "value");

      // Verify logging
      const debugCalls = mockHost.log.mock.calls.filter((call: any) => call[0]?.level === "debug");
      strictEqual(debugCalls.length, 2); // Initial load + change notification
      strictEqual(debugCalls[1]?.[0]?.message, "Configuration changed");
    });

    it("should handle configuration change notifications without typespec settings", async () => {
      let onDidChangeHandler: any;

      const mockConnection = {
        workspace: {
          getConfiguration: vi.fn().mockResolvedValue({ initial: "config" }),
        },
        onDidChangeConfiguration: vi.fn().mockImplementation((handler) => {
          onDidChangeHandler = handler;
        }),
      } as any;

      await configProvider.initialize(mockConnection, mockHost);

      // Reset log calls to focus on change notification behavior
      mockHost.log.mockClear();

      // Simulate a configuration change without typespec settings
      const changeParams = {
        settings: {
          otherExtension: {
            someSetting: "value",
          },
        },
      };

      await onDidChangeHandler(changeParams);

      // Configuration should be completely replaced (not merged) with new settings
      strictEqual(configProvider.get("typespec.initial"), undefined); // Original config is lost
      strictEqual(configProvider.get("otherExtension.someSetting"), "value"); // New settings should be available

      // Verify logging still occurs
      strictEqual(mockHost.log.mock.calls.length, 1);
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.level, "debug");
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.message, "Configuration changed");
    });

    it("should handle configuration updates after initialization", async () => {
      const mockConnection = {
        workspace: {
          getConfiguration: vi.fn().mockResolvedValue({
            lsp: { emit: ["initial"] },
            debug: false,
          }),
        },
        onDidChangeConfiguration: vi.fn(),
      } as any;

      await configProvider.initialize(mockConnection, mockHost);

      // Verify initial configuration - should be under typespec key
      const lspEmit = configProvider.get<string[]>("typespec.lsp.emit");
      strictEqual(lspEmit?.[0], "initial");
      strictEqual(configProvider.get("typespec.debug"), false);

      // Test accessing non-existent nested keys
      const nonExistent = configProvider.get("non.existent.deeply.nested.key");
      strictEqual(nonExistent, undefined);

      // Test with default for non-existent nested keys
      const withDefault = configProvider.get("non.existent.deeply.nested.key", "fallback");
      strictEqual(withDefault, "fallback");

      // Test accessing partial paths that exist
      const typespecConfig = configProvider.get("typespec") as any;
      strictEqual(typeof typespecConfig, "object");
      strictEqual(typespecConfig?.lsp?.emit?.[0], "initial");
    });

    it("should completely replace configuration on change notifications", async () => {
      let onDidChangeHandler: any;

      const mockConnection = {
        workspace: {
          getConfiguration: vi.fn().mockResolvedValue({
            lsp: { emit: ["openapi3"] },
            formatting: { enabled: true },
          }),
        },
        onDidChangeConfiguration: vi.fn().mockImplementation((handler) => {
          onDidChangeHandler = handler;
        }),
      } as any;

      await configProvider.initialize(mockConnection, mockHost);

      // Verify initial configuration
      const initialLspEmit = configProvider.get<string[]>("typespec.lsp.emit");
      strictEqual(initialLspEmit?.[0], "openapi3");
      strictEqual(configProvider.get("typespec.formatting.enabled"), true);

      // Simulate a configuration change that only includes some settings
      const changeParams = {
        settings: {
          typespec: {
            lsp: { emit: ["swagger"] }, // Only lsp settings, no formatting
          },
          newExtension: {
            newSetting: "newValue",
          },
        },
      };

      await onDidChangeHandler(changeParams);

      // Verify configuration was completely replaced
      const updatedLspEmit = configProvider.get<string[]>("typespec.lsp.emit");
      strictEqual(updatedLspEmit?.[0], "swagger");
      strictEqual(configProvider.get("typespec.formatting.enabled"), undefined); // Lost due to replacement
      strictEqual(configProvider.get("newExtension.newSetting"), "newValue");
    });
  });
});
