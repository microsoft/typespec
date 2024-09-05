import { Children, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.jsx";
import { HeaderProperty } from "../../../http/dist/src/http-property.js";

export interface HttpRequestOptionsProps {
  operation: Operation;
  refkey?: Refkey;
  children?: Children;
}

export function HttpRequestOptions(props: HttpRequestOptionsProps) {
  return <ts.VarDeclaration name="httpRequestOptions" refkey={props.refkey}>
    <ts.ObjectExpression>
      <HttpRequestOptions.Headers operation={props.operation} />
    </ts.ObjectExpression>
  </ts.VarDeclaration>
}

export interface HttpRequestOptionsHeadersProps {
  operation: Operation;
  children?: Children;
}

HttpRequestOptions.Headers = function HttpRequestOptionsHeaders(props: HttpRequestOptionsHeadersProps) {
  const httpOperation = $.httpOperation.get(props.operation);
  const headers = httpOperation.parameters.properties.filter(
    (p) => p.kind === "header"
  ) as HeaderProperty[];

  const contentTypeProperty = httpOperation.parameters.properties.find((header) => header.kind === "contentType") 
  let contentType = httpOperation.parameters.body ? <ts.ObjectProperty name='"Content-Type"' value='"application/json"' /> : null;

  if(contentTypeProperty) {
    let contentTypePath = "contentType";
    contentTypePath = contentTypeProperty.property.optional ? `options.${contentTypePath}` : contentTypePath;
    contentType = <ts.ObjectProperty name='"Content-Type"' value={contentTypePath} />;
  }

  return <ts.ObjectProperty name="headers">
      <HttpRequestParametersExpression parameters={headers}>
        {contentType}
      </HttpRequestParametersExpression>
  </ts.ObjectProperty>
}

export interface HttpRequestOptionsBodyProps {
  operation: Operation;
  children?: Children;
}

HttpRequestOptions.Body = function HttpRequestOptionsBody(props: HttpRequestOptionsBodyProps) {
  return <></>;
}
