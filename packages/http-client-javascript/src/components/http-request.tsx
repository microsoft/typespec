import { Children, code, refkey, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {uriTemplateLib} from "./external-packages/uri-template.js";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.js";
import { HttpRequestOptions } from "./http-request-options.js";
import { HttpFetchRefkey } from "./static-fetch-wrapper.jsx";

export interface HttpRequestProps {
  operation: Operation;
  responseRefkey?: Refkey;
}

export function HttpRequest(props: HttpRequestProps) {
  const operationUrlRefkey = refkey();
  const requestOptionsRefkey = refkey();
  const httpResponseRefkey = props.responseRefkey ?? refkey();
  return <>
    <HttpRequest.Url operation={props.operation}  refkey={operationUrlRefkey}/>
    
    <HttpRequestOptions operation={props.operation} refkey={requestOptionsRefkey}  />

    <ts.VarDeclaration name="response" refkey={httpResponseRefkey}>
      await <ts.FunctionCallExpression refkey={HttpFetchRefkey} args={[<ts.Reference refkey={operationUrlRefkey} />, <ts.Reference refkey={requestOptionsRefkey} />]} />
    </ts.VarDeclaration>
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
  const urlParameters = $.httpRequest.getParameters(httpOperation, ["path", "query"]);
  
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
