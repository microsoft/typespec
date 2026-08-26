import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useMonacoSync } from "../src/react/hooks/use-monaco-sync.js";

function createMockModel(initialValue = "") {
  let value = initialValue;
  const listeners: Array<() => void> = [];
  return {
    getValue: vi.fn(() => value),
    setValue: vi.fn((v: string) => {
      value = v;
    }),
    onDidChangeContent: vi.fn((cb: () => void) => {
      listeners.push(cb);
      return { dispose: vi.fn() };
    }),
    // Test helper to simulate typing
    simulateTyping(newValue: string) {
      value = newValue;
      for (const cb of listeners) cb();
    },
  };
}

it("sets model value when content changes externally", () => {
  const model = createMockModel("");

  const { rerender } = renderHook(
    ({ content }) =>
      useMonacoSync({
        typespecModel: model as any,
        content,
        onContentChange: vi.fn(),
      }),
    { initialProps: { content: "initial" } },
  );

  expect(model.setValue).toHaveBeenCalledWith("initial");

  rerender({ content: "updated" });
  expect(model.setValue).toHaveBeenCalledWith("updated");
});

it("does not set model value when content matches model", () => {
  const model = createMockModel("same");

  renderHook(() =>
    useMonacoSync({
      typespecModel: model as any,
      content: "same",
      onContentChange: vi.fn(),
    }),
  );

  expect(model.setValue).not.toHaveBeenCalled();
});

it("calls onContentChange when model content changes (user typing)", () => {
  const model = createMockModel("hello");
  const onContentChange = vi.fn();

  renderHook(() =>
    useMonacoSync({
      typespecModel: model as any,
      content: "hello",
      onContentChange,
    }),
  );

  act(() => {
    model.simulateTyping("hello world");
  });

  expect(onContentChange).toHaveBeenCalledWith("hello world");
});

it("does not call onContentChange when model value matches current content", () => {
  const model = createMockModel("same");
  const onContentChange = vi.fn();

  renderHook(() =>
    useMonacoSync({
      typespecModel: model as any,
      content: "same",
      onContentChange,
    }),
  );

  act(() => {
    model.simulateTyping("same");
  });

  expect(onContentChange).not.toHaveBeenCalled();
});

it("does not reset model after model-driven content change", () => {
  const model = createMockModel("initial");
  const onContentChange = vi.fn();

  const { rerender } = renderHook(
    ({ content }) =>
      useMonacoSync({
        typespecModel: model as any,
        content,
        onContentChange,
      }),
    { initialProps: { content: "initial" } },
  );

  // Simulate typing which triggers onContentChange
  act(() => {
    model.simulateTyping("typed");
  });

  expect(onContentChange).toHaveBeenCalledWith("typed");
  model.setValue.mockClear();

  // Now React re-renders with the new content from state
  rerender({ content: "typed" });

  // Should NOT call setValue again since it was model-driven
  expect(model.setValue).not.toHaveBeenCalled();
});
