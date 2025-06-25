import { Children, code, List, refkey, Refkey, StatementList } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Reference } from "@alloy-js/typescript";
import { HttpOperation } from "@typespec/http";
import { EncodingProvider } from "./encoding-provider.jsx";
import { uriTemplateLib } from "./external-packages/uri-template.js";
import { HttpRequestOptions } from "./http-request-options.js";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.js";

export interface HttpRequestProps {
  httpOperation: HttpOperation;
  operationOptionsParamRefkey: Refkey;
  responseRefkey?: Refkey;
}

export function HttpRequest(props: HttpRequestProps) {
  const operationUrlRefkey = refkey();
  const requestOptionsVarRefkey = refkey();
  const httpResponseRefkey = props.responseRefkey ?? refkey();
  const verb = props.httpOperation.verb;
  return (
    <List>
      <StatementList>
        <HttpRequest.Url
          httpOperation={props.httpOperation}
          pathVarRefkey={operationUrlRefkey}
          requestOptionsParamRefkey={props.operationOptionsParamRefkey}
        />

        <HttpRequestOptions
          httpOperation={props.httpOperation}
          requestOptionsParamRefkey={props.operationOptionsParamRefkey}
          requestOptionsVarRefkey={requestOptionsVarRefkey}
        />

        <ts.VarDeclaration name="response" refkey={httpResponseRefkey}>
          {code`
      await client.pathUnchecked(${(<Reference refkey={operationUrlRefkey} />)}).${verb}(${(<Reference refkey={requestOptionsVarRefkey} />)})
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
  requestOptionsParamRefkey: Refkey;
  pathVarRefkey?: Refkey;
  children?: Children;
}

HttpRequest.Url = function HttpUrlDeclaration(props: HttpUrlProps) {
  const urlTemplate = props.httpOperation.uriTemplate;
  const urlParameters = props.httpOperation.parameters.properties.filter(
    (p) => p.kind === "path" || p.kind === "query",
  );
  return (
    <EncodingProvider defaults={{ bytes: "base64url" }}>
      <ts.VarDeclaration name="path" refkey={props.pathVarRefkey}>
        {uriTemplateLib.parse}({JSON.stringify(urlTemplate)}).expand(
        {
          <HttpRequestParametersExpression
            httpOperation={props.httpOperation}
            optionsParameter={props.requestOptionsParamRefkey}
            parameters={urlParameters}
          />
        }
        )
      </ts.VarDeclaration>
    </EncodingProvider>
  );
};
