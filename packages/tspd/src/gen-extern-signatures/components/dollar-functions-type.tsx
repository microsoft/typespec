import { For, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { FunctionSignature } from "../types.js";

export interface DollarFunctionsTypeProps {
  namespaceName: string;
  functions: FunctionSignature[];
  refkey: Refkey;
}

/** Type for the $functions variable for the given namespace */
export function DollarFunctionsType(props: Readonly<DollarFunctionsTypeProps>) {
  return (
    <ts.TypeDeclaration
      name={getFunctionsRecordForNamespaceName(props.namespaceName)}
      export
      refkey={props.refkey}
    >
      <ts.InterfaceExpression>
        <For each={props.functions}>
          {(signature) => {
            return <ts.InterfaceMember name={signature.name} type={signature.typeName} />;
          }}
        </For>
      </ts.InterfaceExpression>
    </ts.TypeDeclaration>
  );
}

function getFunctionsRecordForNamespaceName(namespaceName: string) {
  return `${namespaceName.replaceAll(".", "")}Functions`;
}
