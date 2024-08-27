import { Children, SourceFile } from "@alloy-js/core";
import { useProject } from "./index.js";

export interface PyProjectTomlFileProps {
  children?: Children;
}

export function PyProjectTomlFile(props: PyProjectTomlFileProps) {
  const context = useProject();
  if (!context) {
    throw new Error("setup.py must be a child of a PythonProject component");
  }

  return (
    <SourceFile path="pyproject.toml" filetype="toml">
      [project]
      name = "{context.name}"
      version = "{context.version}"
      {props.children}
    </SourceFile>
  );
}
