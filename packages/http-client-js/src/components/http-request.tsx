import { Children, code, List, refkey, Refkey, StatementList } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Reference } from "@alloy-js/typescript";
import { HttpOperation } from "@typespec/http";
import { EncodingProvider } from "./encoding-provider.jsx";
import { uriTemplateLib } from "./external-packages/uri-template.js";
import { HttpRequestOptions } from "./http-request-options.js";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.js";
import { getOperationOptionsParameterRefkey } from "./operation-parameters.jsx";

export interface HttpRequestProps {
  httpOperation: HttpOperation;
  responseRefkey?: Refkey;
}

export function HttpRequest(props: HttpRequestProps) {
  const operationUrlRefkey = refkey();
  const requestOptionsRefkey = refkey();
  const httpResponseRefkey = props.responseRefkey ?? refkey();
  const verb = props.httpOperation.verb;
  return (
    <List>
      <StatementList>
        <HttpRequest.Url httpOperation={props.httpOperation} refkey={operationUrlRefkey} />

        <HttpRequestOptions httpOperation={props.httpOperation} refkey={requestOptionsRefkey} />

        <ts.VarDeclaration name="response" refkey={httpResponseRefkey}>
          {code`
      await client.pathUnchecked(${(<Reference refkey={operationUrlRefkey} />)}).${verb}(${(<Reference refkey={requestOptionsRefkey} />)})
      `}
        </ts.VarDeclaration>
        <hbr />
      </StatementList>
      {code`      
      if (typeof options?.operationOptions?.onResponse === "function") {
        options?.operationOptions?.onResponse(response);
      }`}
    </List>
  );
}

export interface HttpUrlProps {
  httpOperation: HttpOperation;
  refkey?: Refkey;
  children?: Children;
}

HttpRequest.Url = function HttpUrlDeclaration(props: HttpUrlProps) {
  const urlTemplate = props.httpOperation.uriTemplate;
  const urlParameters = props.httpOperation.parameters.properties.filter(
    (p) => p.kind === "path" || p.kind === "query",
  );
  const optionsParameter = getOperationOptionsParameterRefkey(props.httpOperation);
  return (
    <EncodingProvider defaults={{ bytes: "base64url" }}>
      <ts.VarDeclaration name="path" refkey={props.refkey}>
        {uriTemplateLib.parse}({JSON.stringify(urlTemplate)}).expand(
        {
          <HttpRequestParametersExpression
            httpOperation={props.httpOperation}
            optionsParameter={optionsParameter!}
            parameters={urlParameters}
          />
        }
        )
      </ts.VarDeclaration>
    </EncodingProvider>
  );
};
