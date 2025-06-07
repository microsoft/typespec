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

  // New tests for extended functionality
  describe("extended configuration API", () => {
    it("should get nested configuration values using dot notation", () => {
      const testConfig = {
        lsp: { emit: ["openapi3"] },
        formatting: { enabled: true, tabSize: 2 },
        diagnostics: { level: "error" },
      };

      configProvider.update(testConfig);

      strictEqual(configProvider.get("lsp.emit"), testConfig.lsp.emit);
      strictEqual(configProvider.get("formatting.enabled"), true);
      strictEqual(configProvider.get("formatting.tabSize"), 2);
      strictEqual(configProvider.get("diagnostics.level"), "error");
    });

    it("should return default values when configuration is missing", () => {
      const defaultValue = "default-value";
      const result = configProvider.get("non.existent.key", defaultValue);
      strictEqual(result, defaultValue);
    });

    it("should check if configuration sections exist", () => {
      const testConfig = {
        lsp: { emit: ["openapi3"] },
        formatting: { enabled: true },
      };

      configProvider.update(testConfig);

      strictEqual(configProvider.has("lsp.emit"), true);
      strictEqual(configProvider.has("formatting.enabled"), true);
      strictEqual(configProvider.has("non.existent"), false);
      strictEqual(configProvider.has("lsp.nonExistent"), false);
    });

    it("should inspect configuration values with metadata", () => {
      const testConfig = { lsp: { emit: ["openapi3"] } };
      configProvider.update(testConfig);

      const inspection = configProvider.inspect<string[]>("lsp.emit");
      strictEqual(Array.isArray(inspection?.value), true);
      strictEqual(inspection?.value?.[0], "openapi3");
      strictEqual(inspection?.scope, "workspace");
    });

    it("should handle complex nested configuration updates", () => {
      const config = {
        server: {
          host: "localhost",
          port: 3000,
          ssl: {
            enabled: false,
            cert: "",
          },
        },
        client: {
          timeout: 5000,
          retries: 3,
        },
      };

      configProvider.update(config);

      strictEqual(configProvider.get("server.host"), "localhost");
      strictEqual(configProvider.get("server.port"), 3000);
      strictEqual(configProvider.get("server.ssl.enabled"), false);
      strictEqual(configProvider.get("client.timeout"), 5000);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle null and undefined values in configuration", () => {
      const testConfig = {
        nullable: null,
        undefinedValue: undefined,
        nested: {
          nullable: null,
          undefinedValue: undefined,
        },
      };

      configProvider.update(testConfig);

      strictEqual(configProvider.get("nullable"), null);
      strictEqual(configProvider.get("undefinedValue"), undefined);
      strictEqual(configProvider.get("nested.nullable"), null);
      strictEqual(configProvider.get("nested.undefinedValue"), undefined);

      // According to implementation, has() checks if value !== undefined
      strictEqual(configProvider.has("nullable"), true); // null is not undefined
      strictEqual(configProvider.has("undefinedValue"), false); // undefined values return false
      strictEqual(configProvider.has("nested.nullable"), true); // null is not undefined
      strictEqual(configProvider.has("nested.undefinedValue"), false); // undefined values return false
    });

    it("should handle empty string keys gracefully", () => {
      configProvider.update({ "": "empty-key-value" });

      strictEqual(configProvider.get(""), "empty-key-value");
      strictEqual(configProvider.has(""), true);
    });

    it("should handle array and object values correctly", () => {
      const testConfig = {
        arrayValue: [1, 2, 3],
        objectValue: { nested: "value" },
        booleanValue: true,
        numberValue: 42,
        stringValue: "test",
      };

      configProvider.update(testConfig);

      const arrayResult = configProvider.get<number[]>("arrayValue");
      strictEqual(Array.isArray(arrayResult), true);
      strictEqual(arrayResult?.[0], 1);

      const objectResult = configProvider.get<{ nested: string }>("objectValue");
      strictEqual(typeof objectResult, "object");
      strictEqual(objectResult?.nested, "value");

      strictEqual(configProvider.get<boolean>("booleanValue"), true);
      strictEqual(configProvider.get<number>("numberValue"), 42);
      strictEqual(configProvider.get<string>("stringValue"), "test");
    });

    it("should handle non-object values in the path correctly", () => {
      const testConfig = {
        stringValue: "test",
        numberValue: 42,
        booleanValue: true,
        nestedObject: {
          innerValue: "inner",
        },
      };

      configProvider.update(testConfig);

      // Trying to access nested properties on non-object values should return undefined
      strictEqual(configProvider.get("stringValue.nonExistent"), undefined);
      strictEqual(configProvider.get("numberValue.nonExistent"), undefined);
      strictEqual(configProvider.get("booleanValue.nonExistent"), undefined);

      // Should work for actual nested objects
      strictEqual(configProvider.get("nestedObject.innerValue"), "inner");

      // has() should return false for non-existent nested paths
      strictEqual(configProvider.has("stringValue.nonExistent"), false);
      strictEqual(configProvider.has("numberValue.nonExistent"), false);
      strictEqual(configProvider.has("booleanValue.nonExistent"), false);
      strictEqual(configProvider.has("nestedObject.innerValue"), true);
    });

    it("should handle configuration replacement correctly", () => {
      // Initial configuration
      configProvider.update({
        existing: "value",
        toBeRemoved: "will be gone",
      });

      strictEqual(configProvider.get("existing"), "value");
      strictEqual(configProvider.get("toBeRemoved"), "will be gone");

      // Update with new configuration (should replace, not merge)
      configProvider.update({
        existing: "updated",
        newValue: "added",
      });

      strictEqual(configProvider.get("existing"), "updated");
      strictEqual(configProvider.get("newValue"), "added");
      strictEqual(configProvider.get("toBeRemoved"), undefined); // Should be removed
      strictEqual(configProvider.has("toBeRemoved"), false);
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
        client: {
          register: vi.fn().mockResolvedValue(undefined),
        },
        workspace: {
          getConfiguration: vi.fn().mockResolvedValue({
            lsp: { emit: ["openapi3"] },
            formatting: { enabled: true },
          }),
        },
        onDidChangeConfiguration: vi.fn(),
      } as any;

      await configProvider.initialize(mockConnection, mockHost);

      // Verify registration was called
      strictEqual(mockConnection.client.register.mock.calls.length, 1);

      // Verify configuration was fetched and applied
      strictEqual(mockConnection.workspace.getConfiguration.mock.calls.length, 1);
      strictEqual(mockConnection.workspace.getConfiguration.mock.calls[0]?.[0], "typespec");

      // Verify configuration is now available
      const lspEmit = configProvider.get<string[]>("lsp.emit");
      strictEqual(lspEmit?.[0], "openapi3");
      strictEqual(configProvider.get("formatting.enabled"), true);

      // Verify change handler was registered
      strictEqual(mockConnection.onDidChangeConfiguration.mock.calls.length, 1);

      // Verify logging
      strictEqual(mockHost.log.mock.calls.length, 1);
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.level, "debug");
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.message, "VSCode settings loaded");
    });

    it("should handle initialization errors gracefully", async () => {
      const mockConnection = {
        client: {
          register: vi.fn().mockRejectedValue(new Error("Registration failed")),
        },
        workspace: {
          getConfiguration: vi.fn(),
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
        client: {
          register: vi.fn().mockResolvedValue(undefined),
        },
        workspace: {
          getConfiguration: vi.fn().mockResolvedValue({ initial: "config" }),
        },
        onDidChangeConfiguration: vi.fn().mockImplementation((handler) => {
          onDidChangeHandler = handler;
        }),
      } as any;

      await configProvider.initialize(mockConnection, mockHost);

      // Simulate a configuration change from VS Code with typespec settings
      const changeParams = {
        settings: {
          typespec: {
            lsp: { emit: ["updated"] },
            newSetting: "value",
          },
        },
      };

      await onDidChangeHandler(changeParams);

      // Verify configuration was updated
      const lspEmit = configProvider.get<string[]>("lsp.emit");
      strictEqual(lspEmit?.[0], "updated");
      strictEqual(configProvider.get("newSetting"), "value");

      // Verify logging
      const debugCalls = mockHost.log.mock.calls.filter((call: any) => call[0]?.level === "debug");
      strictEqual(debugCalls.length, 2); // Initial load + change notification
      strictEqual(debugCalls[1]?.[0]?.message, "Configuration changed");
    });

    it("should handle configuration change notifications without typespec settings", async () => {
      let onDidChangeHandler: any;

      const mockConnection = {
        client: {
          register: vi.fn().mockResolvedValue(undefined),
        },
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

      // Configuration should not be updated (no typespec settings)
      strictEqual(configProvider.get("initial"), "config"); // Original config preserved
      strictEqual(configProvider.get("otherExtension.someSetting"), undefined); // Not updated

      // Verify logging still occurs
      strictEqual(mockHost.log.mock.calls.length, 1);
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.level, "debug");
      strictEqual(mockHost.log.mock.calls[0]?.[0]?.message, "Configuration changed");
    });
  });

  describe("configuration inspection and metadata", () => {
    it("should provide detailed inspection for all value types", () => {
      const testConfig = {
        stringValue: "test",
        numberValue: 42,
        booleanValue: true,
        arrayValue: [1, 2, 3],
        objectValue: { nested: "value" },
        nullValue: null,
        undefinedValue: undefined,
      };

      configProvider.update(testConfig);

      const stringInspection = configProvider.inspect<string>("stringValue");
      strictEqual(stringInspection?.value, "test");
      strictEqual(stringInspection?.scope, "workspace");

      const numberInspection = configProvider.inspect<number>("numberValue");
      strictEqual(numberInspection?.value, 42);
      strictEqual(numberInspection?.scope, "workspace");

      const booleanInspection = configProvider.inspect<boolean>("booleanValue");
      strictEqual(booleanInspection?.value, true);
      strictEqual(booleanInspection?.scope, "workspace");

      const arrayInspection = configProvider.inspect<number[]>("arrayValue");
      strictEqual(Array.isArray(arrayInspection?.value), true);
      strictEqual(arrayInspection?.value?.length, 3);
      strictEqual(arrayInspection?.scope, "workspace");

      const objectInspection = configProvider.inspect<{ nested: string }>("objectValue");
      strictEqual(typeof objectInspection?.value, "object");
      strictEqual(objectInspection?.value?.nested, "value");
      strictEqual(objectInspection?.scope, "workspace");

      const nullInspection = configProvider.inspect("nullValue");
      strictEqual(nullInspection?.value, null);
      strictEqual(nullInspection?.scope, "workspace");

      // undefined values should return undefined from inspect since has() returns false
      const undefinedInspection = configProvider.inspect("undefinedValue");
      strictEqual(undefinedInspection, undefined);
    });

    it("should return undefined for inspection of non-existent keys", () => {
      const inspection = configProvider.inspect("non.existent.key");
      strictEqual(inspection, undefined);
    });

    it("should inspect nested configuration values correctly", () => {
      const testConfig = {
        nested: {
          deeply: {
            buried: {
              value: "found",
            },
          },
        },
      };

      configProvider.update(testConfig);

      const inspection = configProvider.inspect<string>("nested.deeply.buried.value");
      strictEqual(inspection?.value, "found");
      strictEqual(inspection?.scope, "workspace");

      // Non-existent nested path should return undefined
      const nonExistentInspection = configProvider.inspect("nested.deeply.buried.nonExistent");
      strictEqual(nonExistentInspection, undefined);
    });
  });
});
