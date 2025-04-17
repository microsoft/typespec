import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ModelProperty } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { hasDefaultValue } from "../utils/parameters.jsx";
import { getOperationOptionsInterfaceRefkey } from "./static-helpers/interfaces.jsx";
export interface OperationOptionsProps {
  operation: HttpOperation;
  excludes?: ModelProperty[];
}

export function getOperationOptionsTypeRefkey(operation: HttpOperation) {
  return ay.refkey(operation, "operation-options");
}
export function OperationOptionsDeclaration(props: OperationOptionsProps) {
  const namePolicy = ts.useTSNamePolicy();
  const excludes = (props.excludes ?? []).map((p) => p.name);
  const interfaceName = namePolicy.getName(props.operation.operation.name + "Options", "interface");
  const optionalParameters = props.operation.parameters.properties
    .filter(
      (p) =>
        !excludes.includes(p.property.name) && !(p.kind === "bodyProperty" && p.path.length > 1),
    )
    .filter((p) => p.property.optional || hasDefaultValue(p));

  return (
    <ts.InterfaceDeclaration
      export
      name={interfaceName}
      extends={getOperationOptionsInterfaceRefkey()}
      refkey={getOperationOptionsTypeRefkey(props.operation)}
    >
      <ay.For each={optionalParameters} line>
        {(parameter) => (
          <ts.InterfaceMember
            name={parameter.property.name}
            optional
            type={<ef.TypeExpression type={parameter.property.type} />}
          />
        )}
      </ay.For>
    </ts.InterfaceDeclaration>
  );
}
