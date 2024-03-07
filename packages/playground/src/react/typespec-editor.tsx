import { editor } from "monaco-editor";
import { FunctionComponent } from "react";
import { Editor, EditorProps, useMonacoModel } from "./editor.js";
import { PlaygroundEditorsOptions } from "./playground.js";

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
  const model = useMonacoModel(filename);
  model.setValue(value);
  return <Editor model={model} options={options}></Editor>;
};
