import { For, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ModelProperty, Operation } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { hasDefaultValue } from "../utils/parameters.jsx";
import { getOperationOptionsInterfaceRefkey } from "./static-helpers/interfaces.jsx";
export interface OperationOptionsProps {
  httpOperation: HttpOperation;
  excludes?: ModelProperty[];
}

export function getOperationOptionsTypeRefkey(operation: Operation) {
  return refkey(operation, "operation-options");
}
export function OperationOptionsDeclaration(props: OperationOptionsProps) {
  const namePolicy = ts.useTSNamePolicy();
  const excludes = (props.excludes ?? []).map((p) => p.name);
  const interfaceName = namePolicy.getName(
    props.httpOperation.operation.name + "Options",
    "interface",
  );
  const optionalParameters = props.httpOperation.parameters.properties
    .filter((p) => !excludes.includes(p.property.name))
    .filter((p) => p.property.optional || hasDefaultValue(p));

  return (
    <ef.InterfaceDeclaration
      export
      name={interfaceName}
      extends={getOperationOptionsInterfaceRefkey()}
      refkey={getOperationOptionsTypeRefkey(props.httpOperation.operation)}
    >
      <For each={optionalParameters} line>
        {(parameter) => (
          <ts.InterfaceMember
            name={parameter.property.name}
            optional
            type={<ef.TypeExpression type={parameter.property.type} />}
          />
        )}
      </For>
    </ef.InterfaceDeclaration>
  );
}
