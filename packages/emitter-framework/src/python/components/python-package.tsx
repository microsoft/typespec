import {
  Children,
  createContext,
  DeclarationContext,
  Scope,
  SourceDirectory,
  useBinder,
  useContext,
} from "@alloy-js/core";
import { createPythonPackageScope, PythonPackageScope } from "../symbols/package-scope.js";
import { InitFile } from "./init-file.jsx";
import { Namespace } from "@typespec/compiler";
import { ClassDeclaration, EnumDeclaration, PythonModule, PythonProjectContext, useProject } from "./index.js";

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
  type: Namespace;
  name?: string;
  parent?: PythonPackageContext | PythonProjectContext;
  children?: Children;
}

export function PythonPackage(props: PythonPackageProps) {
  const name = props.name ?? props.type.name;

  const parentProject = useProject();
  const parentPackage = usePackage();
  const parentContext = parentPackage ?? parentProject;

  const packageContext = createPackageContext(name, parentContext);

  // construct subpackage components
  const subpackages = [];
  for (const subnamespace of props.type.namespaces.values()) {
    // skip the TypeSpec namespace
    if (subnamespace.name === "TypeSpec") {
      continue
    }
    subpackages.push(<PythonPackage type={subnamespace} parent={parentContext} />);
  }

  // construct module components
  const modules = [];
  if (props.type.models) {
    const modelComponents = [];
    for (const [_, model] of props.type.models) {
      modelComponents.push(<ClassDeclaration type={model} />);
    }
    modules.push(<PythonModule name={"_models.py"} children={modelComponents} />);
  }
  if (props.type.enums) {
    const enumComponents = [];
    for (const [_, enumVal] of props.type.enums) {
      enumComponents.push(<EnumDeclaration type={enumVal} />);
    }
    modules.push(<PythonModule name={"_enums.py"} parent={packageContext} children={enumComponents} />);
  }
  // FIXME: Enable these when components are implemented 
  // if (props.type.unions) {
  //   const unionComponents = [];
  //   for (const [_, unionVal] of props.type.unions) {
  //     unionComponents.push(<UnionDeclaration type={unionVal} />);
  //   }
  //   modules.push(<PythonModule name={"_unions.py"} children={unionComponents} />);
  // }
  // if (props.type.interfaces) {
  //   const interfaceComponents = [];
  //   for (const [_, interfaceVal] of props.type.interfaces) {
  //     interfaceComponents.push(<InterfaceDeclaration type={interfaceVal} />);
  //   }
  //   modules.push(<PythonModule name={"_interfaces.py"} children={interfaceComponents} />);
  // }
  // if (props.type.operations) {
  //   const operationComponents = [];
  //   for (const [_, operationVal] of props.type.operations) {
  //     operationComponents.push(<OperationDeclaration type={operationVal} />);
  //   }
  //   modules.push(<PythonModule name={"_operations.py"} children={operationComponents} />);
  // }  
  return (
    <PythonPackageContext.Provider value={packageContext}>
      <Scope value={packageContext.scope}>
        <SourceDirectory path={name} >
          <InitFile />
          {subpackages}
          {modules}
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
