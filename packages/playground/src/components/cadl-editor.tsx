import { editor } from "monaco-editor";
import { FunctionComponent } from "react";
import { Editor, EditorCommand, useMonacoModel } from "./editor";

export interface CadlEditorProps {
  model: editor.IModel;
  commands?: EditorCommand[];
}

export const CadlEditor: FunctionComponent<CadlEditorProps> = (props) => {
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

export const OutputEditor: FunctionComponent<{ value: string }> = ({ value }) => {
  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly: true,
    language: "json",
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
  };
  const model = useMonacoModel("inmemory://output.json", "json");
  model.setValue(value);
  return <Editor model={model} options={options}></Editor>;
};
