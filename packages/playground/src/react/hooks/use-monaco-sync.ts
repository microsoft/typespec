import { editor } from "monaco-editor";
import { useEffect, useRef } from "react";

export interface UseMonacoSyncOptions {
  typespecModel: editor.ITextModel;
  content: string;
  onContentChange: (content: string) => void;
}

/**
 * Bidirectional sync between a Monaco editor model and React state.
 *
 * - When `content` changes externally (e.g. sample selection), the model is updated.
 * - When the user types in the editor, `onContentChange` is called.
 * - Uses a ref guard (`isModelDrivenChangeRef`) to prevent infinite loops.
 */
export function useMonacoSync({
  typespecModel,
  content,
  onContentChange,
}: UseMonacoSyncOptions): void {
  // Track whether content changes originated from the model (user typing)
  // to avoid the sync effect resetting the model during typing
  const isModelDrivenChangeRef = useRef(false);

  // Sync external content changes → Monaco model
  useEffect(() => {
    if (isModelDrivenChangeRef.current) {
      isModelDrivenChangeRef.current = false;
      return;
    }
    if (typespecModel.getValue() !== (content ?? "")) {
      typespecModel.setValue(content ?? "");
    }
  }, [content, typespecModel]);

  // Use refs to avoid re-subscribing to onDidChangeContent on every keystroke
  const contentRef = useRef(content);
  const onContentChangeRef = useRef(onContentChange);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  // Sync Monaco model changes → React state
  useEffect(() => {
    const disposable = typespecModel.onDidChangeContent(() => {
      const newContent = typespecModel.getValue();
      if (newContent !== contentRef.current) {
        isModelDrivenChangeRef.current = true;
        onContentChangeRef.current(newContent);
      }
    });
    return () => disposable.dispose();
  }, [typespecModel]);
}
