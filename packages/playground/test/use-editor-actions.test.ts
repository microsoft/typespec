import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEditorActions } from "../src/react/hooks/use-editor-actions.js";

function createMockModel(value = "model content") {
  return {
    getValue: vi.fn(() => value),
  };
}

function createMockEditorRef(hasFormatAction = true) {
  const runMock = vi.fn();
  const ref = {
    current: {
      getAction: vi.fn((id: string) => {
        if (id === "editor.action.formatDocument" && hasFormatAction) {
          return { run: runMock };
        }
        return null;
      }),
    },
  };
  return { ref, runMock };
}

describe("useEditorActions", () => {
  const baseProps = {
    selectedEmitter: "openapi3",
    compilerOptions: {},
    selectedSampleName: "basic",
    isSampleUntouched: true,
    selectedViewer: "openapi",
    viewerState: {},
  };

  describe("saveCode", () => {
    it("calls onSave with current model content and state", () => {
      const model = createMockModel("my content");
      const { ref } = createMockEditorRef();
      const onSave = vi.fn();

      const { result } = renderHook(() =>
        useEditorActions({
          ...baseProps,
          typespecModel: model as any,
          editorRef: ref as any,
          onSave,
        }),
      );

      result.current.saveCode();

      expect(onSave).toHaveBeenCalledWith({
        content: "my content",
        emitter: "openapi3",
        compilerOptions: {},
        sampleName: "basic",
        selectedViewer: "openapi",
        viewerState: {},
      });
    });

    it("does not include sampleName when sample is modified", () => {
      const model = createMockModel("modified");
      const { ref } = createMockEditorRef();
      const onSave = vi.fn();

      const { result } = renderHook(() =>
        useEditorActions({
          ...baseProps,
          typespecModel: model as any,
          editorRef: ref as any,
          isSampleUntouched: false,
          onSave,
        }),
      );

      result.current.saveCode();

      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ sampleName: undefined }));
    });

    it("does nothing when onSave is not provided", () => {
      const model = createMockModel();
      const { ref } = createMockEditorRef();

      const { result } = renderHook(() =>
        useEditorActions({
          ...baseProps,
          typespecModel: model as any,
          editorRef: ref as any,
        }),
      );

      // Should not throw
      expect(() => result.current.saveCode()).not.toThrow();
    });
  });

  describe("formatCode", () => {
    it("runs the format document action", () => {
      const model = createMockModel();
      const { ref, runMock } = createMockEditorRef();

      const { result } = renderHook(() =>
        useEditorActions({
          ...baseProps,
          typespecModel: model as any,
          editorRef: ref as any,
        }),
      );

      result.current.formatCode();

      expect(ref.current.getAction).toHaveBeenCalledWith("editor.action.formatDocument");
      expect(runMock).toHaveBeenCalled();
    });
  });

  describe("fileBug", () => {
    it("calls saveCode then onFileBug", async () => {
      const model = createMockModel();
      const { ref } = createMockEditorRef();
      const onSave = vi.fn();
      const onFileBug = vi.fn();

      const { result } = renderHook(() =>
        useEditorActions({
          ...baseProps,
          typespecModel: model as any,
          editorRef: ref as any,
          onSave,
          onFileBug,
        }),
      );

      await result.current.fileBug();

      expect(onSave).toHaveBeenCalled();
      expect(onFileBug).toHaveBeenCalled();
    });

    it("does nothing when onFileBug is not provided", async () => {
      const model = createMockModel();
      const { ref } = createMockEditorRef();
      const onSave = vi.fn();

      const { result } = renderHook(() =>
        useEditorActions({
          ...baseProps,
          typespecModel: model as any,
          editorRef: ref as any,
          onSave,
        }),
      );

      await result.current.fileBug();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("editorActions", () => {
    it("returns a save action with Ctrl+S keybinding", () => {
      const model = createMockModel();
      const { ref } = createMockEditorRef();

      const { result } = renderHook(() =>
        useEditorActions({
          ...baseProps,
          typespecModel: model as any,
          editorRef: ref as any,
        }),
      );

      expect(result.current.editorActions).toHaveLength(1);
      expect(result.current.editorActions[0].id).toBe("save");
      expect(result.current.editorActions[0].label).toBe("Save");
      expect(result.current.editorActions[0].keybindings).toBeDefined();
    });
  });
});
