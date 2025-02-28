import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { httpRuntimeTemplateLib } from "../external-packages/ts-http-runtime.js";

export function getOperationOptionsInterfaceRefkey() {
  return ay.refkey("OperationOptions", "interface");
}

export function OperationOptionsInterfaceDeclaration() {
  const declarationRefkey = getOperationOptionsInterfaceRefkey();
  const onResponseCallback = ay.code`(rawResponse: ${httpRuntimeTemplateLib.PathUncheckedResponse}) => void`;

  const operationOptions =
    <ts.InterfaceExpression>
  <ts.InterfaceMember name="onResponse" optional type={onResponseCallback} />
</ts.InterfaceExpression>;
  return <ts.InterfaceDeclaration export name="OperationOptions" refkey={declarationRefkey}>
    <ts.InterfaceMember name="operationOptions" optional type={operationOptions}/>
  </ts.InterfaceDeclaration>;
}

export function Interfaces() {
  return <ts.SourceFile path="interfaces.ts">
    <OperationOptionsInterfaceDeclaration />
  </ts.SourceFile>;
}
