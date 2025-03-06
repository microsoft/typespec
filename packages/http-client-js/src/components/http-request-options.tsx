import { Children, code, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ClientOperation } from "@typespec/http-client";
import { EncodingProvider } from "./encoding-provider.jsx";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.jsx";
import { getOperationOptionsParameterRefkey } from "./operation-parameters.jsx";
import { OperationTransformExpression } from "./transforms/operation-transform-expression.jsx";

export interface HttpRequestOptionsProps {
  operation: ClientOperation;
  refkey?: Refkey;
  children?: Children;
}

export function HttpRequestOptions(props: HttpRequestOptionsProps) {
  return <ts.VarDeclaration name="httpRequestOptions" refkey={props.refkey}>
    <ts.ObjectExpression>
      <HttpRequestOptions.Headers operation={props.operation} />
      <HttpRequestOptions.Body operation={props.operation} />
    </ts.ObjectExpression>
  </ts.VarDeclaration>;
}

export interface HttpRequestOptionsHeadersProps {
  operation: ClientOperation;
  children?: Children;
}

HttpRequestOptions.Headers = function HttpRequestOptionsHeaders(
  props: HttpRequestOptionsHeadersProps,
) {
  // Extract the header request parameters from the operation
  const httpOperation = props.operation.httpOperation;
  const headers = httpOperation.parameters.properties.filter(
    (p) => p.kind === "header" || p.kind === "contentType",
  );

  const optionsParam = getOperationOptionsParameterRefkey(props.operation.httpOperation);
  return <EncodingProvider defaults={{bytes: "base64", datetime: "rfc7231"}}><ts.ObjectProperty name="headers">
        <HttpRequestParametersExpression parameters={headers} optionsParameter={optionsParam} />,
    </ts.ObjectProperty></EncodingProvider>;
};

export interface HttpRequestOptionsBodyProps {
  operation: ClientOperation;
  itemName?: string;
  children?: Children;
}

HttpRequestOptions.Body = function HttpRequestOptionsBody(props: HttpRequestOptionsBodyProps) {
  const httpOperation = props.operation.httpOperation;
  const body = httpOperation.parameters.body;

  if (!body) {
    return <></>;
  }
  // The transformer to apply to the body.
  const bodyTransform = <>
      <OperationTransformExpression operation={props.operation}/>
  </>;

  return <>
    <ts.ObjectProperty name="body" value={bodyTransform} />,
    </>;
};

export function JSONSerializer(props: { children?: Children }) {
  return code`JSON.stringify(${props.children})`;
}
