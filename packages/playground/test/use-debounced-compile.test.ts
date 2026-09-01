import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useDebouncedCompile } from "../src/react/hooks/use-debounced-compile.js";

function createMockModel() {
  const listeners: Array<() => void> = [];
  return {
    onDidChangeContent: vi.fn((cb: () => void) => {
      listeners.push(cb);
      return { dispose: vi.fn() };
    }),
    simulateChange() {
      for (const cb of listeners) cb();
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

it("triggers compile after debounce delay on content change", () => {
  const model = createMockModel();
  const doCompile = vi.fn(() => Promise.resolve());

  renderHook(() =>
    useDebouncedCompile({
      typespecModel: model as any,
      doCompile,
      debounceDelay: 100,
    }),
  );

  act(() => {
    model.simulateChange();
  });

  // Not called immediately
  expect(doCompile).not.toHaveBeenCalled();

  // Called after delay
  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(doCompile).toHaveBeenCalledTimes(1);
});

it("debounces rapid changes into a single compile", () => {
  const model = createMockModel();
  const doCompile = vi.fn(() => Promise.resolve());

  renderHook(() =>
    useDebouncedCompile({
      typespecModel: model as any,
      doCompile,
      debounceDelay: 200,
    }),
  );

  act(() => {
    model.simulateChange();
  });
  act(() => {
    vi.advanceTimersByTime(50);
  });
  act(() => {
    model.simulateChange();
  });
  act(() => {
    vi.advanceTimersByTime(50);
  });
  act(() => {
    model.simulateChange();
  });

  // Still no call
  expect(doCompile).not.toHaveBeenCalled();

  // After full debounce from last change
  act(() => {
    vi.advanceTimersByTime(200);
  });
  expect(doCompile).toHaveBeenCalledTimes(1);
});

it("uses default 200ms delay when debounceDelay is not provided", () => {
  const model = createMockModel();
  const doCompile = vi.fn(() => Promise.resolve());

  renderHook(() =>
    useDebouncedCompile({
      typespecModel: model as any,
      doCompile,
    }),
  );

  act(() => {
    model.simulateChange();
  });

  act(() => {
    vi.advanceTimersByTime(199);
  });
  expect(doCompile).not.toHaveBeenCalled();

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(doCompile).toHaveBeenCalledTimes(1);
});

it("cleans up subscription on unmount", () => {
  const disposeMock = vi.fn();
  const model = {
    onDidChangeContent: vi.fn(() => ({ dispose: disposeMock })),
  };
  const doCompile = vi.fn(() => Promise.resolve());

  const { unmount } = renderHook(() =>
    useDebouncedCompile({
      typespecModel: model as any,
      doCompile,
      debounceDelay: 100,
    }),
  );

  unmount();
  expect(disposeMock).toHaveBeenCalled();
});
