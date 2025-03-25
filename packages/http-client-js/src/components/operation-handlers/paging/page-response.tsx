import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { PagingOperation } from "@typespec/compiler";
export interface PageResponseProps {
  operation: HttpOperation;
  pagingOperation: PagingOperation;
}

export function getPageResponseTypeRefkey(operation: HttpOperation) {
  return ay.refkey(operation, "page-response");
}
export function PageResponseDeclaration(props: PageResponseProps) {
  const namePolicy = ts.useTSNamePolicy();
  const interfaceName = namePolicy.getName(props.operation.operation.name + "PageResponse", "interface");
  const definedSettings = props.pagingOperation.output;
  const settings = [];
  if(definedSettings.continuationToken) {
    settings.push(definedSettings.continuationToken);
  }
  if(definedSettings.pageItems) {
    settings.push(definedSettings.pageItems);
  }

  if(definedSettings.nextLink) {
    settings.push(definedSettings.nextLink);
  }
   
  return (
    <ts.InterfaceDeclaration
      export
      name={interfaceName}
      refkey={getPageResponseTypeRefkey(props.operation)}
    >
      <ay.For each={settings} line>
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
