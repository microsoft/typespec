import { For, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { PagingOperation, PagingProperty } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
export interface PageResponseProps {
  operation: HttpOperation;
  pagingOperation: PagingOperation;
}

export function getPageResponseTypeRefkey(operation: HttpOperation) {
  return refkey(operation, "page-response");
}
export function PageResponseDeclaration(props: PageResponseProps) {
  const namePolicy = ts.useTSNamePolicy();
  const interfaceName = namePolicy.getName(
    props.operation.operation.name + "PageResponse",
    "interface",
  );
  const definedResponses = props.pagingOperation.output;
  // Only accept these respose items
  const acceptedColumns = [
    "continuationToken",
    "pageItems",
    "nextLink",
    "prevLink",
    "firstLink",
    "lastLink",
  ];
  // TODO: consider the nested response
  // https://github.com/microsoft/typespec/issues/7787
  const responseProperties: PagingProperty[] = [];
  for (const key in definedResponses) {
    const property = definedResponses[key as keyof typeof definedResponses];
    if (acceptedColumns.includes(key) && !!property) {
      responseProperties.push(property);
    }
  }

  return (
    <ts.InterfaceDeclaration
      export
      name={interfaceName}
      refkey={getPageResponseTypeRefkey(props.operation)}
    >
      <For each={responseProperties} line>
        {(parameter) => (
          <ts.InterfaceMember
            name={parameter.property.name}
            optional={parameter.property.optional}
            type={<ef.TypeExpression type={parameter.property.type} />}
          />
        )}
      </For>
    </ts.InterfaceDeclaration>
  );
}
