import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperationBody } from "@typespec/http";
import { ClientOperation } from "@typespec/http-client";
import { JsonTransform } from "./json/json-transform.jsx";
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
  return (
    <>
      <TransformToTransportDeclaration operation={props.operation} refkey={refkey} />
    </>
  );
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
    name: "payload",
    type: <ef.TypeExpression type={props.payload.type} />,
    refkey: inputRef,
  };

  return (
    <ts.FunctionDeclaration
      export
      name={props.name}
      parameters={[payloadParameter]}
      refkey={props.refkey}
    >
      return <JsonTransform itemRef={inputRef} target="transport" type={props.payload.type} />
      !;
    </ts.FunctionDeclaration>
  );
}

interface TransformToTransportDeclarationProps {
  operation: ClientOperation;
  refkey: ay.Refkey;
}

function TransformToTransportDeclaration(props: TransformToTransportDeclarationProps) {
  const requestPayload = props.operation.httpOperation.parameters.body;
  if (!requestPayload || !requestPayload.property) {
    return;
  }

  if (requestPayload.bodyKind === "file") return;

  const namePolicy = ts.useTSNamePolicy();
  const name = namePolicy.getName(`${props.operation.name}_payload_to_transport`, "function");

  if (requestPayload.bodyKind === "multipart") {
    return null;
  }

  return (
    <SingleBodyTransformDeclaration
      operation={props.operation}
      payload={requestPayload}
      refkey={props.refkey}
      name={name}
    />
  );
}
