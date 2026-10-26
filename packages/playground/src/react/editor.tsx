import { Uri, editor, type IDisposable } from "monaco-editor";
import { useEffect, useMemo, useRef, type FunctionComponent } from "react";

/** Bind a caller-owned Monaco model to an editor with optional actions and a mount callback. */
export interface EditorProps {
  /** Model displayed by the editor; changing this prop switches models without recreating the editor. */
  model: editor.IModel;
  /** Actions registered on the editor and removed when this list changes or the component unmounts. */
  actions?: editor.IActionDescriptor[];
  /** Construction options read on mount, overriding the component's automatic-layout defaults. */
  options: editor.IStandaloneEditorConstructionOptions;
  /** Called after creating the editor on mount; later prop changes do not invoke it again. */
  onMount?: (data: OnMountData) => void;
}

/** Monaco instance supplied to an editor's mount callback. */
export interface OnMountData {
  /** Created editor, available for commands, selections, and other imperative operations. */
  editor: editor.IStandaloneCodeEditor;
}

export interface EditorCommand {
  binding: number;
  handle: () => void;
}

/** Render a Monaco editor that follows model and action changes without recreating its instance. */
export const Editor: FunctionComponent<EditorProps> = ({ model, options, actions, onMount }) => {
  const editorContainerRef = useRef(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    editorRef.current = editor.create(editorContainerRef.current!, {
      model,
      automaticLayout: true,
      fixedOverflowWidgets: true,
      ...options,
    });
    onMount?.({ editor: editorRef.current });
    // This needs special handling where we only want to run this effect once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const disposables: IDisposable[] = [];
    for (const command of actions ?? []) {
      disposables.push(editorRef.current!.addAction(command));
    }
    return () => {
      disposables.forEach((x) => x.dispose());
    };
  }, [actions]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setModel(model);
    }
  }, [model]);

  return (
    <div
      className="monaco-editor-container"
      style={{ width: "100%", height: "100%" }}
      ref={editorContainerRef}
      data-tabster='{"uncontrolled": {}}' // https://github.com/microsoft/tabster/issues/316
    ></div>
  );
};

/**
 * Reuse a Monaco model registered for `uri`, or create an empty model with the requested language.
 * An existing model's content and language are left unchanged. Models are globally shared by URI;
 * this hook does not dispose them on unmount, so callers must manage their lifetime.
 */
export function useMonacoModel(uri: string, language?: string): editor.IModel {
  return useMemo(() => {
    const monacoUri = Uri.parse(uri);
    return editor.getModel(monacoUri) ?? editor.createModel("", language, monacoUri);
  }, [uri, language]);
}
