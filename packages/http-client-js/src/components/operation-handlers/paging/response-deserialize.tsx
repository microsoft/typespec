import { Children, code, List, Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { httpRuntimeTemplateLib } from "../../external-packages/ts-http-runtime.js";
import { HttpResponseProps, HttpResponses } from "../../http-response.jsx";
import { getOperationOptionsTypeRefkey } from "../../operation-options.jsx";
import { getOperationOptionsParameterRefkey } from "../../operation-parameters.jsx";
import { getCreateRestErrorRefkey } from "../../static-helpers/rest-error.jsx";

export function getHttpRequestDeserializeRefkey(httpOperation: HttpOperation) {
  return refkey(httpOperation, "http-request-deserialize");
}

export interface HttpResponseDeserializeProps {
  httpOperation: HttpOperation;
  responseRefkey: Refkey;
  children?: Children;
}

export function HttpResponseDeserialize(props: HttpResponseProps) {
  const httpOperation = props.httpOperation;
  const namePolicy = ts.useTSNamePolicy();
  const functionName = namePolicy.getName(httpOperation.operation.name + "Deserialize", "function");
  const params = [
    {
      name: "response",
      type: httpRuntimeTemplateLib.PathUncheckedResponse,
    },
    {
      name: "options",
      refkey: getOperationOptionsParameterRefkey(httpOperation),
      type: getOperationOptionsTypeRefkey(httpOperation),
      optional: true,
    },
  ];
  return (
    <FunctionDeclaration
      name={functionName}
      refkey={getHttpRequestDeserializeRefkey(httpOperation)}
      parametersMode="replace"
      parameters={params}
    >
      {code`      
      if (typeof options?.operationOptions?.onResponse === "function") {
        options?.operationOptions?.onResponse(response);
      }`}
      <List hardline>
        <HttpResponses httpOperation={props.httpOperation} />
        {code`throw ${getCreateRestErrorRefkey()}(response);`}
      </List>
    </FunctionDeclaration>
  );
}
