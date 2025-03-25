import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { PagingOperation } from "@typespec/compiler";
export interface PageSettingsProps {
  operation: HttpOperation;
  pagingOperation: PagingOperation;
}

export function getPageSettingsTypeRefkey(operation: HttpOperation) {
  return ay.refkey(operation, "page-settings");
}
export function PageSettingsDeclaration(props: PageSettingsProps) {
  const namePolicy = ts.useTSNamePolicy();
  const interfaceName = namePolicy.getName(props.operation.operation.name + "PageSettings", "interface");
  const definedSettings = props.pagingOperation.input;
  const settings = [];
  if(definedSettings.continuationToken) {
    settings.push(definedSettings.continuationToken);
  }
  if(definedSettings.offset) {
    settings.push(definedSettings.offset);
  }
   
  return (
    <ts.InterfaceDeclaration
      export
      name={interfaceName}
      refkey={getPageSettingsTypeRefkey(props.operation)}
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
