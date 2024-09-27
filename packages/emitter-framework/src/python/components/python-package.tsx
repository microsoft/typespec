import {
  Children,
  createContext,
  Scope,
  SourceDirectory,
  useBinder,
  useContext,
} from "@alloy-js/core";
import { createPythonPackageScope, PythonPackageScope } from "../symbols/package-scope.js";
import { InitFile } from "./init-file.jsx";
import { PythonProjectContext, useProject } from "./index.js";

export interface PythonPackageContext {
  scope: PythonPackageScope;
  /** Name of package, usually name of this directory */
  name: string;
  /** The parent package or project for this package */
  parent: PythonPackageContext | PythonProjectContext | undefined;
}

export const PythonPackageContext = createContext<PythonPackageContext>();

export function usePackage() {
  return useContext(PythonPackageContext);
}

/** A Python package is a SourceDirectory with an __init__ file.
 * Every package will have an __init__.py file.
 */
export interface PythonPackageProps {
  name: string;
  parent?: PythonPackageContext | PythonProjectContext;
  children?: Children;
}

export function PythonPackage(props: PythonPackageProps) {
  const name = props.name;

  const parentProject = useProject();
  const parentPackage = usePackage();
  const parentContext = parentPackage ?? parentProject;

  const packageContext = createPackageContext(name, parentContext);
  return (
    <PythonPackageContext.Provider value={packageContext}>
      <Scope value={packageContext.scope}>
        <SourceDirectory path={name} >
          <InitFile />
          {props.children}
        </SourceDirectory>
      </Scope>
    </PythonPackageContext.Provider>
  );
}

function createPackageContext(name: string, parent: PythonPackageContext | PythonProjectContext | undefined): PythonPackageContext {
  
  const scope = createPythonPackageScope(
    useBinder(),
    name
  );

  return {
    scope: scope,
    name: name,
    parent: parent,
  };
}
