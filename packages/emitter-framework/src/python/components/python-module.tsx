import { createContext, Scope, SourceFile, useBinder, useContext } from "@alloy-js/core"
import { Children } from "@alloy-js/core"
import { createPythonModuleScope, PythonModuleScope } from "../symbols/index.js";
import { PythonPackageContext, usePackage } from "./index.js";

export interface PythonModuleContext {
  scope: PythonModuleScope;
  /** Name of module, usually name of the file */
  name: string;
  /** The parent package for this module */
  parent: PythonPackageContext | undefined;
}

export const PythonModuleContext = createContext<PythonModuleContext>();

export function useModule() {
  return useContext(PythonModuleContext);
}

/**
 * A Python Module is basically a SourceFile containing declarations.
 */
export interface PythonModuleProps {
  name: string;
  parent?: PythonPackageContext;
  children?: Children;
}

export function PythonModule(props: PythonModuleProps) {
  const filename = props.name.endsWith(".py") ?  props.name : `${props.name}.py`;
  const packageContext = usePackage();
  const moduleContext = createModuleContext(filename, packageContext);
  return (
    <PythonModuleContext.Provider value={moduleContext}>
      <Scope value={moduleContext.scope}>
        <SourceFile path={filename} filetype="py">
          {props.children}
        </SourceFile>
      </Scope>
    </PythonModuleContext.Provider>
  );
}

function createModuleContext(name: string, parent: PythonPackageContext | undefined): PythonModuleContext {
  
  const scope = createPythonModuleScope(
    useBinder(),
    name
  );

  return {
    scope: scope,
    name: name,
    parent: parent
  };
}
