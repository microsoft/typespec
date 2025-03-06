import { Children, code, refkey, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Reference } from "@alloy-js/typescript";
import { ClientOperation } from "@typespec/http-client";
import { EncodingProvider } from "./encoding-provider.jsx";
import { uriTemplateLib } from "./external-packages/uri-template.js";
import { HttpRequestOptions } from "./http-request-options.js";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.js";
import { getOperationOptionsParameterRefkey } from "./operation-parameters.jsx";

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
      await client.pathUnchecked(${<Reference refkey={operationUrlRefkey}/>}).${verb}(${<Reference refkey={requestOptionsRefkey}/>})
      
      if (typeof options?.operationOptions?.onResponse === "function") {
        options?.operationOptions?.onResponse(response);
      }

      `}
      
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
  const urlParameters = httpOperation.parameters.properties.filter(
    (p) => p.kind === "path" || p.kind === "query",
  );
  const optionsParameter = getOperationOptionsParameterRefkey(props.operation.httpOperation);
  return <EncodingProvider defaults={{bytes: "base64url"}}>
    <ts.VarDeclaration name="path" refkey={props.refkey}>
      {uriTemplateLib.parse}({JSON.stringify(urlTemplate)}).expand({<HttpRequestParametersExpression optionsParameter={optionsParameter!} parameters={urlParameters} />})
    </ts.VarDeclaration>
  </EncodingProvider>;
};
