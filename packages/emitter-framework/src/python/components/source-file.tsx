import { Children } from "@alloy-js/core/jsx-runtime";
import {
  createContext,
  OutputSymbol,
  Scope,
  SourceFile as CoreSourceFile,
  useContext,
} from "@alloy-js/core";
import { PythonPackageScope, PythonProjectScope, Reference, useProject } from "../index.js";
import { usePackage } from "./python-package.jsx";

export interface SourceFileContext {
  scope: PythonPackageScope | PythonProjectScope;
}

export const SourceFileContext = createContext<SourceFileContext>();

export function useSourceFile(): SourceFileContext | undefined {
  return useContext(SourceFileContext);
}

export interface SourceFileProps {
  path: string;
  children?: Children;
}

/**
 * Represents a Python source file.
 *
 * Handles top level package declaration, as well as importing other sources
 */
export function SourceFile(props: SourceFileProps) {
  const packageCtx = usePackage();
  const projectCtx = useProject();
  const context = packageCtx ?? projectCtx;
  if (!context) {
    throw new Error("SourceFile must be a child of a PythonProject or PythonPackage");
  }

  return (
    <CoreSourceFile path={props.path} filetype="py" reference={Reference}>
      <SourceFileContext.Provider value={context}>
        <Scope name={props.path} kind="source-file">
          {props.children}
        </Scope>
      </SourceFileContext.Provider>
    </CoreSourceFile>
  );
}
