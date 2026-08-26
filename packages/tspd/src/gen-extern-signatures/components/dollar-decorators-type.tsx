import { For, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { DecoratorSignature } from "../types.js";

export interface DollarDecoratorsTypeProps {
  namespaceName: string;
  decorators: DecoratorSignature[];
  refkey: Refkey;
}

/** Type for the $decorators variable for the given namespace */
export function DollarDecoratorsType(props: Readonly<DollarDecoratorsTypeProps>) {
  return (
    <ts.TypeDeclaration
      name={getDecoratorRecordForNamespaceName(props.namespaceName)}
      export
      refkey={props.refkey}
    >
      <ts.InterfaceExpression>
        <For each={props.decorators}>
          {(signature) => {
            return <ts.InterfaceMember name={signature.name.slice(1)} type={signature.typeName} />;
          }}
        </For>
      </ts.InterfaceExpression>
    </ts.TypeDeclaration>
  );
}

function getDecoratorRecordForNamespaceName(namespaceName: string) {
  return `${namespaceName.replaceAll(".", "")}Decorators`;
}
