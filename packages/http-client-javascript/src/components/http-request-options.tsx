import { Children, code, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.jsx";

export interface HttpRequestOptionsProps {
  operation: Operation;
  refkey?: Refkey;
  children?: Children;
}

export function HttpRequestOptions(props: HttpRequestOptionsProps) {
  const method = JSON.stringify($.httpOperation.get(props.operation).verb);
  return <ts.VarDeclaration name="httpRequestOptions" refkey={props.refkey}>
    <ts.ObjectExpression>
      <ts.ObjectProperty name="method" value={method} />,
      <HttpRequestOptions.Headers operation={props.operation} />
      <HttpRequestOptions.Body operation={props.operation} />
    </ts.ObjectExpression>
  </ts.VarDeclaration>;
}

export interface HttpRequestOptionsHeadersProps {
  operation: Operation;
  children?: Children;
}

HttpRequestOptions.Headers = function HttpRequestOptionsHeaders(
  props: HttpRequestOptionsHeadersProps,
) {
  // Extract the header request parameters from the operation
  const httpOperation = $.httpOperation.get(props.operation);
  const headers = $.httpRequest.getParameters(httpOperation, "header");

  // Prepare the default content type, to use in case no explicit content type is provided
  let contentType = $.httpRequest.getBodyParameters(httpOperation) ? (
    <ts.ObjectProperty name='"Content-Type"' value='"application/json"' />
  ) : null;

  // Extract the content type property from the header request parameters, if available
  const contentTypeProperty = $.httpRequest
    .getParameters(httpOperation, "contentType")
    ?.properties.get("contentType");

  // If the content type property is available, use it to set the content type header.
  if (contentTypeProperty) {
    let contentTypePath = "contentType";
    contentTypePath = contentTypeProperty.optional ? `options.${contentTypePath}` : contentTypePath;
    // Override the default content type
    contentType = <ts.ObjectProperty name='"Content-Type"' value={contentTypePath} />;
  }

  return <ts.ObjectProperty name="headers">
      <HttpRequestParametersExpression parameters={headers}>
        {contentType}
      </HttpRequestParametersExpression>,
  </ts.ObjectProperty>;
};

export interface HttpRequestOptionsBodyProps {
  operation: Operation;
  itemName?: string;
  children?: Children;
}

HttpRequestOptions.Body = function HttpRequestOptionsBody(props: HttpRequestOptionsBodyProps) {
  const httpOperation = $.httpOperation.get(props.operation);
  const body = $.httpRequest.getParameters(httpOperation, "body");
  // If @body or @bodyRoot was used then collapse a model with a single property to that property type.
  const collapse = $.httpRequest.body.isExplicit(httpOperation);

  if (!body) {
    return <></>;
  }

  // The transformer to apply to the body.
  const bodyTransform =
    <ef.TypeTransformCall type={body} target="transport" collapse={collapse} optionsBagName="options"/>;

  return <>
    <ts.ObjectProperty name="body" value={<JSONSerializer>{bodyTransform}</JSONSerializer>} />,
    </>;
};

export function JSONSerializer(props: { children?: Children }) {
  return code`JSON.stringify(${props.children})`;
}
