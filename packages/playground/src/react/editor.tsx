import { editor, IDisposable, Uri } from "monaco-editor";
import { FunctionComponent, useEffect, useMemo, useRef } from "react";

export interface EditorProps {
  model: editor.IModel;
  actions?: editor.IActionDescriptor[];
  options: editor.IStandaloneEditorConstructionOptions;
}

export interface EditorCommand {
  binding: number;
  handle: () => void;
}

export const Editor: FunctionComponent<EditorProps> = ({ model, options, actions }) => {
  const editorContainerRef = useRef(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    editorRef.current = editor.create(editorContainerRef.current!, {
      model,
      automaticLayout: true,
      ...options,
    });
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
      css={{ width: "100%", height: "100%", overflow: "hidden" }}
      ref={editorContainerRef}
    ></div>
  );
};

export function useMonacoModel(uri: string, language?: string): editor.IModel {
  return useMemo(() => {
    const monacoUri = Uri.parse(uri);
    return editor.getModel(monacoUri) ?? editor.createModel("", language, monacoUri);
  }, [uri, language]);
}
