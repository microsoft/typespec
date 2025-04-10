import { Children, code, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { HttpOperation } from "@typespec/http";
import { EncodingProvider } from "./encoding-provider.jsx";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.jsx";
import { getOperationOptionsParameterRefkey } from "./operation-parameters.jsx";
import { OperationTransformExpression } from "./transforms/operation-transform-expression.jsx";

export interface HttpRequestOptionsProps {
  httpOperation: HttpOperation;
  refkey?: Refkey;
  children?: Children;
}

export function HttpRequestOptions(props: HttpRequestOptionsProps) {
  return (
    <ts.VarDeclaration name="httpRequestOptions" refkey={props.refkey}>
      <ts.ObjectExpression>
        <HttpRequestOptions.Headers httpOperation={props.httpOperation} />
        <HttpRequestOptions.Body httpOperation={props.httpOperation} />
      </ts.ObjectExpression>
    </ts.VarDeclaration>
  );
}

export interface HttpRequestOptionsHeadersProps {
  httpOperation: HttpOperation;
  children?: Children;
}

HttpRequestOptions.Headers = function HttpRequestOptionsHeaders(
  props: HttpRequestOptionsHeadersProps,
) {
  // Extract the header request parameters from the operation
  const httpOperation = props.httpOperation;
  const headers = props.httpOperation.parameters.properties.filter(
    (p) => p.kind === "header" || p.kind === "contentType",
  );

  const optionsParam = getOperationOptionsParameterRefkey(props.httpOperation);
  return (
    <EncodingProvider defaults={{ bytes: "base64", datetime: "rfc7231" }}>
      <ts.ObjectProperty name="headers">
        <HttpRequestParametersExpression
          parameters={headers}
          optionsParameter={optionsParam}
          httpOperation={httpOperation}
        />
        ,
      </ts.ObjectProperty>
    </EncodingProvider>
  );
};

export interface HttpRequestOptionsBodyProps {
  httpOperation: HttpOperation;
  itemName?: string;
  children?: Children;
}

HttpRequestOptions.Body = function HttpRequestOptionsBody(props: HttpRequestOptionsBodyProps) {
  const body = props.httpOperation.parameters.body;

  if (!body) {
    return <></>;
  }
  // The transformer to apply to the body.
  const bodyTransform = (
    <>
      <OperationTransformExpression httpOperation={props.httpOperation} />
    </>
  );

  return (
    <>
      <ts.ObjectProperty name="body" value={bodyTransform} />,
    </>
  );
};

export function JSONSerializer(props: { children?: Children }) {
  return code`JSON.stringify(${props.children})`;
}
