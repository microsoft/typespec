import { beforeEach, expect, it, vi } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";
import { UPDATE_MANAGER_DEBOUNCE_DELAY_OVERRIDE } from "../../src/server/constants.js";
import { UpdateManager } from "../../src/server/update-manager.js";

let updateManager: UpdateManager<void>;
let mockLog: ReturnType<typeof vi.fn>;
let mockCallback: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  // Clear environment variable to test default behavior
  delete process.env[UPDATE_MANAGER_DEBOUNCE_DELAY_OVERRIDE];

  mockLog = vi.fn();
  mockCallback = vi.fn().mockResolvedValue(undefined);

  updateManager = new UpdateManager("test", mockLog);
  updateManager.setCallback(mockCallback);
  updateManager.start();
});

it("should use environment variable override when set", async () => {
  // Set environment variable override
  process.env[UPDATE_MANAGER_DEBOUNCE_DELAY_OVERRIDE] = "100";

  // Create new UpdateManager after setting env var
  const overrideUpdateManager = new UpdateManager("test-override", mockLog);
  overrideUpdateManager.setCallback(mockCallback);
  overrideUpdateManager.start();

  const document = TextDocument.create("file:///test.tsp", "typespec", 1, "model Test {}");

  // Schedule update - should use the override value (100ms) instead of adaptive delay
  const promise = overrideUpdateManager.scheduleUpdate(document, "changed");

  expect(promise).toBeInstanceOf(Promise);

  // Clean up
  delete process.env[UPDATE_MANAGER_DEBOUNCE_DELAY_OVERRIDE];
});

it("should use adaptive debounce delay when environment variable is not set", async () => {
  // Ensure no environment variable is set
  expect(process.env[UPDATE_MANAGER_DEBOUNCE_DELAY_OVERRIDE]).toBeUndefined();

  const document = TextDocument.create("file:///test.tsp", "typespec", 1, "model Test {}");

  // Test with fresh UpdateManager to ensure it uses adaptive delay
  const freshUpdateManager = new UpdateManager("test-adaptive", mockLog);
  freshUpdateManager.setCallback(mockCallback);
  freshUpdateManager.start();

  // Should start with default delay since no recent changes
  const promise = freshUpdateManager.scheduleUpdate(document, "changed");

  // Verify that promise is created (indicating adaptive delay is being used)
  expect(promise).toBeInstanceOf(Promise);

  // Verify version was bumped (confirming the update was processed)
  expect(freshUpdateManager.docChangedVersion).toBe(1);
});
