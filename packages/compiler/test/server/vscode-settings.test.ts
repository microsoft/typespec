import { strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import {
  ClientConfigProvider,
  createClientConfigProvider,
} from "../../src/server/client-config-provider.js";

let configProvider: ClientConfigProvider;

beforeEach(() => {
  // Create a new client config provider before each test
  configProvider = createClientConfigProvider();
});

describe("configuration API", () => {
  it("should return undefined when configuration is not initialized", () => {
    const config = configProvider.config;
    strictEqual(config, undefined);
  });
  it("should handle accessing config properties safely", () => {
    const config = configProvider.config;
    strictEqual(config?.lsp?.emit, undefined);
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

    const config = configProvider.config;
    strictEqual(config?.lsp?.emit?.[0], "openapi3");
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
    const initialConfig = configProvider.config;
    strictEqual(initialConfig?.lsp?.emit?.[0], "openapi3");

    // Simulate a configuration change that only includes some settings
    const changeParams = {
      settings: {
        typespec: {
          lsp: { emit: ["swagger"] },
        },
      },
    };

    await onDidChangeHandler(changeParams);

    // Verify configuration was updated
    const updatedConfig = configProvider.config;
    strictEqual(updatedConfig?.lsp?.emit?.[0], "swagger");
  });
});
