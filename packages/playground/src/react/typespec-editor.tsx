import { editor, Range } from "monaco-editor";
import { useCallback, useEffect, useRef, useState, type FunctionComponent } from "react";
import { Editor, useMonacoModel, type EditorProps } from "./editor.js";
import type { PlaygroundEditorsOptions } from "./playground.js";
import "./typespec-editor.css";

// Re-export for backward compatibility
export { getChangedLineNumbers } from "./diff-utils.js";

export interface TypeSpecEditorProps extends Omit<EditorProps, "options"> {
  options?: editor.IStandaloneEditorConstructionOptions;
}

export const TypeSpecEditor: FunctionComponent<TypeSpecEditorProps> = ({
  actions,
  options,
  ...other
}) => {
  const resolvedOptions: editor.IStandaloneEditorConstructionOptions = {
    "semanticHighlighting.enabled": true,
    automaticLayout: true,
    tabSize: 2,
    minimap: {
      enabled: false,
    },
    ...options,
  };
  return <Editor actions={actions} options={resolvedOptions} {...other}></Editor>;
};

export const OutputEditor: FunctionComponent<{
  filename: string;
  value: string;
  changedLineNumbers?: number[];
  editorOptions?: PlaygroundEditorsOptions;
}> = ({ filename, value, changedLineNumbers, editorOptions }) => {
  const model = useMonacoModel(filename);
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const decorationCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  const onMount = useCallback(({ editor: ed }: { editor: editor.IStandaloneCodeEditor }) => {
    decorationCollectionRef.current = ed.createDecorationsCollection();
    setEditorInstance(ed);
  }, []);

  useEffect(() => {
    if (filename === "") return;
    model.setValue(value);
  }, [filename, value, model]);

  // Apply changed line decorations — they persist until the next compilation clears them.
  // The deps include `filename` and `value` so that decorations are (re-)applied after the
  // editor's model is swapped or its content is replaced via `setValue` (both of which can
  // discard previously-applied decorations). This ensures highlighting shows whenever a
  // changed file is navigated to, not only for the file that was open at compile time.
  useEffect(() => {
    if (!editorInstance || !decorationCollectionRef.current) return;

    if (changedLineNumbers && changedLineNumbers.length > 0 && changedLineNumbers.length < 500) {
      decorationCollectionRef.current.set(
        changedLineNumbers.map((line) => ({
          range: new Range(line, 1, line, 1),
          options: {
            isWholeLine: true,
            className: "playground-changed-line",
          },
        })),
      );
    } else {
      decorationCollectionRef.current.clear();
    }
  }, [changedLineNumbers, editorInstance, filename, value]);

  if (filename === "") {
    return null;
  }
  const options: editor.IStandaloneEditorConstructionOptions = {
    ...editorOptions,
    readOnly: true,
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
  };
  return <Editor model={model} options={options} onMount={onMount}></Editor>;
};
