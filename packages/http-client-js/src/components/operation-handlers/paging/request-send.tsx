import * as ay from "@alloy-js/core";
import { List, Refkey, StatementList, code, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Reference } from "@alloy-js/typescript";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import * as cl from "@typespec/http-client";
import { getClientcontextDeclarationRef } from "../../client-context/client-context-declaration.jsx";
import { HttpRequestOptions } from "../../http-request-options.jsx";
import { HttpRequest } from "../../http-request.jsx";
import {
  getOperationOptionsParameterRefkey,
  getOperationParameters,
} from "../../operation-parameters.jsx";

export interface HttpRequestSendProps {
  httpOperation: HttpOperation;
  responseRefkey?: Refkey;
}

export function getHttpRequestSendRefkey(httpOperation: HttpOperation) {
  return refkey(httpOperation, "http-request-send");
}

export function getHttpRequestSendParams(httpOperation: HttpOperation) {
  const clientLibrary = cl.useClientLibrary();
  const client = clientLibrary.getClientForOperation(httpOperation);
  const clientContextInterfaceRef = getClientcontextDeclarationRef(client!);
  const signatureParams: ts.ParameterDescriptor[] = [
    { name: "client", type: clientContextInterfaceRef, refkey: ay.refkey(client, "client") },
    ...getOperationParameters(httpOperation),
  ];
  const parameters: ts.ParameterDescriptor[] = [...signatureParams];
  // re-correct the `options` parameter to Record<string, any> to accept both paging and non-paging options
  parameters[parameters.length - 1] = {
    name: "options",
    type: "Record<string, any>",
    refkey: getOperationOptionsParameterRefkey(httpOperation),
    optional: true,
  };
  return parameters;
}

export function HttpRequestSend(props: HttpRequestSendProps) {
  const httpOperation = props.httpOperation;
  const operationUrlRefkey = refkey();
  const requestOptionsRefkey = refkey();
  const verb = props.httpOperation.verb;
  const namePolicy = ts.useTSNamePolicy();
  const functionName = namePolicy.getName(httpOperation.operation.name + "Send", "function");
  const parameters = getHttpRequestSendParams(httpOperation);
  return (
    <FunctionDeclaration
      name={functionName}
      async
      refkey={getHttpRequestSendRefkey(httpOperation)}
      parametersMode="replace"
      parameters={parameters}
    >
      <List>
        <StatementList>
          <HttpRequest.Url httpOperation={props.httpOperation} refkey={operationUrlRefkey} />

          <HttpRequestOptions httpOperation={props.httpOperation} refkey={requestOptionsRefkey} />
          {code`return await client.pathUnchecked(${(<Reference refkey={operationUrlRefkey} />)}).${verb}(${(<Reference refkey={requestOptionsRefkey} />)});`}
        </StatementList>
      </List>
    </FunctionDeclaration>
  );
}
