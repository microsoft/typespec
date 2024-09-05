import { Children, code, refkey, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {uriTemplateLib} from "./external-packages/uri-template.js";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.js";
import { HttpRequestOptions } from "./http-request-options.js";

export interface HttpRequestProps {
  operation: Operation;
}

export function HttpRequest(props: HttpRequestProps) {
  const operationUrlRefkey = refkey();
  const requestOptionsRefkey = refkey();
  return <>
    <HttpRequest.Url operation={props.operation}  refkey={operationUrlRefkey}/>
    
    <HttpRequestOptions operation={props.operation} refkey={requestOptionsRefkey}  />
  </>
}

export interface HttpUrlProps {
  operation: Operation;
  refkey?: Refkey;
  children?: Children;
}

HttpRequest.Url = function HttpUrlDeclaration(props: HttpUrlProps) {
  const httpOperation = $.httpOperation.get(props.operation);
  const urlTemplate = httpOperation.uriTemplate;
  const urlParameters = httpOperation.parameters.properties.filter(
    (p) =>
      $.modelProperty.isHttpQueryParam(p.property) || $.modelProperty.isHttpPathParam(p.property)
  );
  
  return <>
    <ts.VarDeclaration name="path">
      <ts.Reference refkey={uriTemplateLib.parse} />({JSON.stringify(urlTemplate)}).expand({<HttpRequestParametersExpression parameters={urlParameters} />})
    </ts.VarDeclaration>

    <ts.VarDeclaration name="url" refkey={props.refkey}>
      {code`
      \`\${client.endpoint.replace(/\\/+$/, '')}\/\${path.replace(/\\/+$/, '')}\`
      `}
    </ts.VarDeclaration>
  </>
}
