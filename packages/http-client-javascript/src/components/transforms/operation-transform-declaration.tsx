import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperationBody, HttpOperationMultipartBody, HttpOperationPart } from "@typespec/http";
import { ClientOperation } from "@typespec/http-client-library";
import { MultipartTransformExpression } from "./operation-transform-expression.jsx";
export interface TransformDeclarationProps {
  operation: ClientOperation;
  refkey?: ay.Refkey;
}

export function getTransformDeclarationRef(operaion: ClientOperation) {
  if (operaion.httpOperation.parameters.body?.bodyKind === "single") {
    return ef.getTypeTransformerRefkey(operaion.httpOperation.parameters.body.type, "transport");
  }
  return ay.refkey(operaion, "transform");
}

export function TransformDeclaration(props: TransformDeclarationProps) {
  const refkey = props.refkey ?? getTransformDeclarationRef(props.operation);
  return <>
    <TransformToTransportDeclaration operation={props.operation} refkey={refkey} />
  </>;
}

export interface SingleBodyTransformDeclarationProps {
  name: string;
  operation: ClientOperation;
  payload: HttpOperationBody;
  refkey: ay.Refkey;
}

export function SingleBodyTransformDeclaration(props: SingleBodyTransformDeclarationProps) {
  const inputRef = ay.refkey(props.payload, "property");
  const payloadParameter: ts.ParameterDescriptor = {
    type: <ef.TypeExpression type={props.payload.type} />,
    refkey: inputRef,
  };

  return <ts.FunctionDeclaration export name={props.name} parameters={{payload: payloadParameter}} refkey={props.refkey}>
    return <ef.TypeTransformCall target="transport" type={props.payload.type} optionsBagName="options" itemPath={["payload"]} />;
  </ts.FunctionDeclaration>;
}

interface TransformToTransportDeclarationProps {
  operation: ClientOperation;
  refkey: ay.Refkey;
}

function TransformToTransportDeclaration(props: TransformToTransportDeclarationProps) {
  const requestPayload = props.operation.httpOperation.parameters.body;
  if (!requestPayload) {
    return;
  }

  const namePolicy = ts.useTSNamePolicy();
  const name = namePolicy.getName(`${props.operation.name}_payload_to_transport`, "function");

  if (requestPayload.bodyKind === "multipart") {
    return <MultipartTransformDeclaration operation={props.operation} payload={requestPayload} refkey={props.refkey} name={name} />;
  }

  return <SingleBodyTransformDeclaration operation={props.operation} payload={requestPayload} refkey={props.refkey} name={name} />;
}

export interface MultipartTransformDeclarationProps {
  name: string;
  operation: ClientOperation;
  payload: HttpOperationMultipartBody;
  refkey: ay.Refkey;
}

export function MultipartTransformDeclaration(props: MultipartTransformDeclarationProps) {
  const inputRef = ay.refkey(props.payload, "property");
  const payloadParameter: ts.ParameterDescriptor = {
    type: <ef.TypeExpression type={props.payload.type} />,
    refkey: inputRef,
  };

  return <ts.FunctionDeclaration export name={props.name} parameters={{payload: payloadParameter}} refkey={props.refkey}>
    return <MultipartTransformExpression operation={props.operation} payload={props.payload} />;
  </ts.FunctionDeclaration>;
}

export interface HttpPartExpressionProps {
  part: HttpOperationPart;
  inputRef: ay.Refkey;
}
