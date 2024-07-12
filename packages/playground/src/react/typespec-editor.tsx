import { editor } from "monaco-editor";
import type { FunctionComponent } from "react";
import { Editor, useMonacoModel, type EditorProps } from "./editor.js";
import type { PlaygroundEditorsOptions } from "./playground.js";

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
  editorOptions?: PlaygroundEditorsOptions;
}> = ({ filename, value, editorOptions }) => {
  const model = useMonacoModel(filename);
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
  model.setValue(value);
  return <Editor model={model} options={options}></Editor>;
};
