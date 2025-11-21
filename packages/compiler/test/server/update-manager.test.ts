import { beforeEach, expect, it, vi } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocumentIdentifier } from "vscode-languageserver";
import { UpdateManager } from "../../src/server/update-manager.js";
import { ServerLog } from "../../src/server/types.js";

interface PendingUpdate {
  latest: TextDocument | TextDocumentIdentifier;
  latestUpdateTimestamp: number;
}

type UpdateCallback<T> = (
  updates: PendingUpdate[],
  triggeredBy: TextDocument | TextDocumentIdentifier,
) => Promise<T>;

let mockLog: (sl: ServerLog) => void;
let mockCallback: UpdateCallback<void>;

beforeEach(async () => {
  mockLog = vi.fn();
  mockCallback = vi.fn().mockResolvedValue(undefined);
});

it("should use fixed debounce delay of 0ms when specified in constructor", async () => {
  // Create UpdateManager with fixed delay of 0ms
  const fixedDelayUpdateManager = new UpdateManager("test-fixed", mockLog, 0);
  fixedDelayUpdateManager.setCallback(mockCallback);
  fixedDelayUpdateManager.start();

  // Verify that the fixed delay is correctly set to 0ms
  const actualDelay = (fixedDelayUpdateManager as any).getDebounceDelay();
  expect(actualDelay).toBe(0);
});

it("should return default delay (500ms) on first call to getAdaptiveDebounceDelay", async () => {
  // Create UpdateManager without fixed delay
  const adaptiveUpdateManager = new UpdateManager("test-adaptive", mockLog);
  adaptiveUpdateManager.setCallback(mockCallback);
  adaptiveUpdateManager.start();

  // When no fixed delay is specified, getDebounceDelay should return -1 (indicating adaptive mode)
  const debounceDelay = (adaptiveUpdateManager as any).getDebounceDelay();
  expect(debounceDelay).toBe(-1);

  // Access the getAdaptiveDebounceDelay method to get the actual adaptive delay
  const getAdaptiveDebounceDelay = (adaptiveUpdateManager as any).getAdaptiveDebounceDelay;
  const actualDelay = getAdaptiveDebounceDelay();

  // Verify adaptive delay returns the expected value (should be 500ms initially)
  expect(actualDelay).toBe(500);
});

it("should return higher delay when there are frequent document changes", async () => {
  // Create UpdateManager without fixed delay to use adaptive delay
  const updateManager = new UpdateManager("test-frequent", mockLog);
  updateManager.setCallback(mockCallback);
  updateManager.start();

  const mockGetWindowedDocChangedTimesteps = vi.fn(() => {
    // Return 15 timestamps to simulate moderate typing (frequency >= 10, should trigger 800ms delay)
    return Array.from({ length: 15 }, (_, i) => Date.now() - i * 100);
  });
  (updateManager as any).getWindowedDocChangedTimesteps = mockGetWindowedDocChangedTimesteps;

  // Access the getAdaptiveDebounceDelay method
  const getAdaptiveDebounceDelay = (updateManager as any).getAdaptiveDebounceDelay;
  const adaptiveDelay = getAdaptiveDebounceDelay();

  // Verify the mock was called
  expect(mockGetWindowedDocChangedTimesteps).toHaveBeenCalled();

  // Should return higher delay (800ms) due to moderate typing frequency (15 >= 10)
  expect(adaptiveDelay).toBe(800);
  expect(adaptiveDelay).toBeGreaterThan(500);
});
