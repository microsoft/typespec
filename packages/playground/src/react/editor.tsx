import { Uri, editor, type IDisposable } from "monaco-editor";
import { useEffect, useMemo, useRef, type FunctionComponent } from "react";

export interface EditorProps {
  model: editor.IModel;
  actions?: editor.IActionDescriptor[];
  options: editor.IStandaloneEditorConstructionOptions;
  onMount?: (data: OnMountData) => void;
}

export interface OnMountData {
  editor: editor.IStandaloneCodeEditor;
}

export interface EditorCommand {
  binding: number;
  handle: () => void;
}

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

export function useMonacoModel(uri: string, language?: string): editor.IModel {
  return useMemo(() => {
    const monacoUri = Uri.parse(uri);
    return editor.getModel(monacoUri) ?? editor.createModel("", language, monacoUri);
  }, [uri, language]);
}
