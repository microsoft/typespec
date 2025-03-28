import * as ay from "@alloy-js/core";
import { List, Refkey, StatementList, code, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Reference } from "@alloy-js/typescript";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { HttpRequestOptions } from "../../http-request-options.jsx";
import { HttpRequest } from "../../http-request.jsx";

export interface HttpRequestSendProps {
  httpOperation: HttpOperation;
  responseRefkey?: Refkey;
  signatureParams: Record<string, ts.ParameterDescriptor | ay.Children>;
}

export function getHttpRequestSendRefkey(httpOperation: HttpOperation) {
  return refkey(httpOperation, "http-request-send");
}

export function HttpRequestSend(props: HttpRequestSendProps) {
  const httpOperation = props.httpOperation;
  const operationUrlRefkey = refkey();
  const requestOptionsRefkey = refkey();
  const httpResponseRefkey = props.responseRefkey ?? refkey();
  const verb = props.httpOperation.verb;
  const namePolicy = ts.useTSNamePolicy();
  const functionName = namePolicy.getName(httpOperation.operation.name + "Send", "function");
  return (
    <FunctionDeclaration
      name={functionName}
      async
      refkey={getHttpRequestSendRefkey(httpOperation)}
      parametersMode="replace"
      parameters={props.signatureParams}
    >
      <List>
        <StatementList>
          <HttpRequest.Url httpOperation={props.httpOperation} refkey={operationUrlRefkey} />

          <HttpRequestOptions httpOperation={props.httpOperation} refkey={requestOptionsRefkey} />

          <ts.VarDeclaration name="response" refkey={httpResponseRefkey}>
            {code`
      await client.pathUnchecked(${(<Reference refkey={operationUrlRefkey} />)}).${verb}(${(<Reference refkey={requestOptionsRefkey} />)})
      `}
          </ts.VarDeclaration>
        </StatementList>
        {code`      
      if (typeof options?.operationOptions?.onResponse === "function") {
        options?.operationOptions?.onResponse(response);
      }
      return response;`}
      </List>
    </FunctionDeclaration>
  );
}
