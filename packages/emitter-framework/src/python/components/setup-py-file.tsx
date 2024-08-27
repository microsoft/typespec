import { Children, SourceFile } from "@alloy-js/core";
import { useProject } from "./index.js";

export interface SetupPyFileProps {
  children?: Children
}

export function SetupPyFile(props: SetupPyFileProps) {
  const context = useProject();
  if (!context) {
    throw new Error("setup.py must be a child of a PythonProject component");
  }

  return (
    <SourceFile path="setup.py" filetype="python">
      from setuptools import setup, find_packages

      setup(
        name="{context.name}",
        version="{context.version}",
        packages=find_packages(where="src"),
        package_dir={"{"}"": "src"{"}"},
      )
      {props.children}
    </SourceFile>
  ); 
}
