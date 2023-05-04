import { editor } from "monaco-editor";
import { FunctionComponent } from "react";
import { Editor, EditorCommand, useMonacoModel } from "./editor.js";

export interface TypeSpecEditorProps {
  model: editor.IModel;
  commands?: EditorCommand[];
}

export const TypeSpecEditor: FunctionComponent<TypeSpecEditorProps> = (props) => {
  const options: editor.IStandaloneEditorConstructionOptions = {
    "semanticHighlighting.enabled": true,
    automaticLayout: true,
    tabSize: 2,
    minimap: {
      enabled: false,
    },
  };
  // Add shortcuts
  return <Editor model={props.model} commands={props.commands} options={options}></Editor>;
};

export const OutputEditor: FunctionComponent<{ filename: string; value: string }> = ({
  filename,
  value,
}) => {
  if (filename === "") {
    return null;
  }
  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly: true,
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
  };
  const model = useMonacoModel(`inmemory://test/${filename.replace(/\//g, "-")}`);
  model.setValue(value);
  return <Editor model={model} options={options}></Editor>;
};
