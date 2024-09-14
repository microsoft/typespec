import { Children, code, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { getEffectiveModelType, Model, Operation, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { HttpRequestParametersExpression } from "./http-request-parameters-expression.jsx";
import * as ef from "@typespec/emitter-framework/typescript";

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
  </ts.VarDeclaration>
}

export interface HttpRequestOptionsHeadersProps {
  operation: Operation;
  children?: Children;
}

HttpRequestOptions.Headers = function HttpRequestOptionsHeaders(props: HttpRequestOptionsHeadersProps) {
  const httpOperation = $.httpOperation.get(props.operation);
  const headers = $.httpRequest.getParameters(httpOperation, "header");

  const contentTypeProperty = $.httpRequest.getParameters(httpOperation, "contentType")?.properties.get("contentType");
  let contentType = $.httpRequest.getBodyParameters(httpOperation) ? <ts.ObjectProperty name='"Content-Type"' value='"application/json"' /> : null;

  if(contentTypeProperty) {
    let contentTypePath = "contentType";
    contentTypePath = contentTypeProperty.optional ? `options.${contentTypePath}` : contentTypePath;
    contentType = <ts.ObjectProperty name='"Content-Type"' value={contentTypePath} />;
  }

  return <ts.ObjectProperty name="headers">
      <HttpRequestParametersExpression parameters={headers}>
        {contentType}
      </HttpRequestParametersExpression>,
  </ts.ObjectProperty>
}

export interface HttpRequestOptionsBodyProps {
  operation: Operation;
  itemName?: string;
  children?: Children;
}

HttpRequestOptions.Body = function HttpRequestOptionsBody(props: HttpRequestOptionsBodyProps) {
  const httpOperation = $.httpOperation.get(props.operation);
  const body = httpOperation.parameters.body;
  
  if(!body) {
  return <></>;
  }

  const namePolicy = ts.useTSNamePolicy();

  let bodyName = props.itemName ?? body.property?.name ?? "";
  let modelType: Type;
  if(body.type.kind === "Model") {
    modelType = getEffectiveModelType($.program, body.type as Model);
    bodyName ??= $.type.getPlausibleName(modelType)
  } else {
    modelType = body.property!.type;
  }

  const bodyTransform = <ef.TypeTransformCall type={modelType} target="transport" itemName={namePolicy.getName(bodyName, "parameter")}/>;
  return <><ts.ObjectProperty name="body" value={<JSONSerializer>{bodyTransform}</JSONSerializer>} />,</>;
}


export function JSONSerializer(props: { children?: Children }) {
  return code`JSON.stringify(${props.children})`;
}
