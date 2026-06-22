import type { CompilerOptions } from "@typespec/compiler";
import { KeyCode, KeyMod, editor } from "monaco-editor";
import { useCallback, useMemo, type RefObject } from "react";
import type { PlaygroundState } from "../use-playground-state.js";

export interface PlaygroundSaveData extends PlaygroundState {
  /** Current content of the playground. */
  content: string;
  /** Emitter name. */
  emitter: string;
}

export interface UseEditorActionsOptions {
  typespecModel: editor.ITextModel;
  editorRef: RefObject<editor.IStandaloneCodeEditor | undefined>;
  selectedEmitter: string;
  compilerOptions: CompilerOptions;
  tspconfig: string;
  selectedSampleName: string;
  isSampleUntouched: boolean;
  selectedViewer?: string;
  viewerState: Record<string, any>;
  onSave?: (value: PlaygroundSaveData) => void;
  onFileBug?: () => void;
}

export interface UseEditorActionsResult {
  saveCode: () => void;
  formatCode: () => void;
  fileBug: () => Promise<void>;
  editorActions: editor.IActionDescriptor[];
}

export function useEditorActions({
  typespecModel,
  editorRef,
  selectedEmitter,
  compilerOptions,
  tspconfig,
  selectedSampleName,
  isSampleUntouched,
  selectedViewer,
  viewerState,
  onSave,
  onFileBug,
}: UseEditorActionsOptions): UseEditorActionsResult {
  const saveCode = useCallback(() => {
    if (onSave) {
      const currentContent = typespecModel.getValue();
      onSave({
        content: currentContent,
        emitter: selectedEmitter,
        compilerOptions,
        tspconfig,
        sampleName: isSampleUntouched ? selectedSampleName : undefined,
        selectedViewer,
        viewerState,
      });
    }
  }, [
    typespecModel,
    onSave,
    selectedEmitter,
    compilerOptions,
    tspconfig,
    selectedSampleName,
    isSampleUntouched,
    selectedViewer,
    viewerState,
  ]);

  const formatCode = useCallback(() => {
    void editorRef.current?.getAction("editor.action.formatDocument")?.run();
  }, [editorRef]);

  const fileBug = useCallback(async () => {
    if (onFileBug) {
      saveCode();
      onFileBug();
    }
  }, [onFileBug, saveCode]);

  const editorActions = useMemo(
    (): editor.IActionDescriptor[] => [
      { id: "save", label: "Save", keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS], run: saveCode },
    ],
    [saveCode],
  );

  return { saveCode, formatCode, fileBug, editorActions };
}
