import {
  Children,
  createContext,
  Scope,
  SourceDirectory,
  SourceDirectoryContext,
  SourceFile,
  useBinder,
  useContext,
} from "@alloy-js/core";
import { createPythonProjectScope, PyProjectTomlFile, PythonPackage, PythonProjectScope, SetupPyFile } from "../index.js";
import { join } from "path";
import { Program } from "@typespec/compiler";

/**
 * A Python project is a collection of Python packages and packaging metadata.
 * {path}/{project_name}/
 * |-- LICENSE
 * |-- pyproject.toml
 * |-- README.md
 * |-- setup.py
 * |-- src/
 *     |-- {package_name}/
 *     |   |-- __init__.py
 *     |   |-- {module_name}.py
 *     |-- {package_name}/
 *         |-- __init__.py
 *         |-- {module_name}.py
 */
export interface PythonProjectProps {
  type: Program;
  name: string;
  version: string;
  path?: string;
  children?: Children;
}

export const PythonProjectContext = createContext<PythonProjectContext>();

export function useProject(): PythonProjectContext | undefined {
  const ctx = useContext(PythonProjectContext);
  return ctx;
}

export interface PythonProjectContext {
  scope: PythonProjectScope;
  path: string;
  fullPath: string;
  name: string;
  version: string;
}

export function PythonProject(props: PythonProjectProps) {
  const parentDir = useContext(SourceDirectoryContext);
  const projectPath = join((props.path ?? parentDir!.path), props.name);
  const projectContext = createProjectContext(props.name, props.version, projectPath);
  const globalNamespace = props.type.getGlobalNamespaceType();
  return (
    <PythonProjectContext.Provider value={projectContext}>
      <Scope value={projectContext.scope}>
        <SourceDirectory path={projectPath}>
          <PyProjectTomlFile />
          <SetupPyFile />
          <SourceFile path="LICENSE" filetype="plain-text" />
          <SourceFile path="README.md" filetype="markdown" />
          <PythonPackage type={globalNamespace} parent={projectContext} name={projectContext.name} />
          {props.children}
        </SourceDirectory>
      </Scope>
    </PythonProjectContext.Provider>
  );
}

function createProjectContext(
  name: string,
  version: string,
  path: string,
): PythonProjectContext {
  const parentDir = useContext(SourceDirectoryContext);
  const fullPath = parentDir ? `${parentDir.path}/${path}` : path;

  const scope = createPythonProjectScope(
    useBinder(),
    name
  );

  return {
    scope: scope,
    path: path,
    fullPath: fullPath,
    name: name,
    version: version,
  };
}
