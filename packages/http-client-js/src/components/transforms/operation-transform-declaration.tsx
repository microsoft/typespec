import { Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperationBody } from "@typespec/http";
import { JsonTransform } from "./json/json-transform.jsx";

export interface TransformDeclarationProps {
  operation: Operation;
  refkey?: Refkey;
}

export function getTransformDeclarationRef(operation: Operation) {
  return refkey(operation, "transform");
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
  operation: Operation;
  payload: HttpOperationBody;
  refkey: Refkey;
}

export function SingleBodyTransformDeclaration(props: SingleBodyTransformDeclarationProps) {
  const inputRef = refkey(props.payload, "property");
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
  operation: Operation;
  refkey: Refkey;
}

function TransformToTransportDeclaration(props: TransformToTransportDeclarationProps) {
  const { $ } = useTsp();
  const httpOperation = $.httpOperation.get(props.operation);
  const requestPayload = httpOperation.parameters.body;
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
