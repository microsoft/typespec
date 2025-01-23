import { Children, code, refkey, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Reference } from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/typekit";
import { ClientOperation } from "@typespec/http-client-library";
import { uriTemplateLib } from "./external-packages/uri-template.js";
import { HttpRequestOptions } from "./http-request-options.js";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.js";

export interface HttpRequestProps {
  operation: ClientOperation;
  responseRefkey?: Refkey;
}

export function HttpRequest(props: HttpRequestProps) {
  const operationUrlRefkey = refkey();
  const requestOptionsRefkey = refkey();
  const httpResponseRefkey = props.responseRefkey ?? refkey();
  const verb = props.operation.httpOperation.verb;
  return <>
    <HttpRequest.Url operation={props.operation}  refkey={operationUrlRefkey}/>
    
    <HttpRequestOptions operation={props.operation} refkey={requestOptionsRefkey}  />

    <ts.VarDeclaration name="response" refkey={httpResponseRefkey}>
      {code`
      await client.path(${<Reference refkey={operationUrlRefkey}/>}).${verb}(${<Reference refkey={requestOptionsRefkey}/>})`}
    </ts.VarDeclaration>
  </>;
}

export interface HttpUrlProps {
  operation: ClientOperation;
  refkey?: Refkey;
  children?: Children;
}

HttpRequest.Url = function HttpUrlDeclaration(props: HttpUrlProps) {
  const httpOperation = props.operation.httpOperation;
  const urlTemplate = httpOperation.uriTemplate;
  const urlParameters = $.httpRequest.getParameters(httpOperation, ["path", "query"]);

  return <>
    <ts.VarDeclaration name="path" refkey={props.refkey}>
      <ts.Reference refkey={uriTemplateLib.parse} />({JSON.stringify(urlTemplate)}).expand({<HttpRequestParametersExpression parameters={urlParameters} />})
    </ts.VarDeclaration>
  </>;
};
