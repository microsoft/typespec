import {
  Binder,
  Children,
  Declaration as CoreDeclaration,
  Refkey,
} from "@alloy-js/core";
import { createPythonSymbol, PythonOutputScope } from "../symbols/index.js";

export interface DeclarationProps {
  name?: string;
  refkey?: Refkey;
  binder?: Binder;
  scope?: PythonOutputScope;
  export?: boolean;
  children?: Children;
}

export function Declaration(props: DeclarationProps) {
  if (!props.refkey) {
    throw new Error("Declaration requires a refkey");
  }
  if (!props.name) {
    throw new Error("Declaration requires a name");
  }
  const options = {
    name: props.name,
    refkey: props.refkey,
    binder: props.binder,
    scope: props.scope,
    export: props.export,
  }
  const sym = createPythonSymbol(options);
  return (
    <CoreDeclaration symbol={sym}>
      {props.children}
    </CoreDeclaration>
  );
}
