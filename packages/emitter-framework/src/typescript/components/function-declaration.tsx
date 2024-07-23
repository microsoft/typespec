import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";

export interface FunctionDeclarationProps extends ts.FunctionDeclarationProps {
  type?: Operation;
}

export function FunctionDeclaration(props: FunctionDeclarationProps) {
  return <ts.FunctionDeclaration {...props} />;
}
