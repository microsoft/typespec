import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperationBody, HttpOperationMultipartBody, HttpOperationPart } from "@typespec/http";
import { ClientOperation } from "@typespec/http-client-library";
import { getCreateFilePartDescriptorReference } from "../static-helpers/multipart-helpers.jsx";
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
}

export interface MultipartTransformDeclarationProps {
  name: string;
  operation: ClientOperation;
  payload: HttpOperationMultipartBody;
  refkey: ay.Refkey;
}

export function MultipartTransformDeclaration(props: MultipartTransformDeclarationProps) {
  const parts = props.payload.parts;
  const inputRef = ay.refkey(props.payload, "property");
  const payloadParameter: ts.ParameterDescriptor = {
    type: <ef.TypeExpression type={props.payload.type} />,
    refkey: inputRef,
  };
  const partsBody = ay.mapJoin(
    parts,
    (part) => <HttpPartExpression part={part} inputRef={inputRef}/>,
    { joiner: ",\n" },
  );
  return <ts.FunctionDeclaration export name={props.name} parameters={{payload: payloadParameter}} refkey={props.refkey}>
    return [{partsBody}]
  </ts.FunctionDeclaration>;
}

export interface HttpPartExpressionProps {
  part: HttpOperationPart;
  inputRef: ay.Refkey;
}

export function HttpPartExpression(props: HttpPartExpressionProps) {
  const namePolicy = ts.useTSNamePolicy();
  const partName = ts.ValueExpression({ jsValue: props.part.name });

  const partApplicationName = namePolicy.getName(props.part.name!, "object-member-data");

  if (isPartArray(props.part)) {
    const xRef = ay.refkey();
    const xDec =
      <ts.Declaration name="x" nameKind="variable" refkey={xRef}>(<ay.Name />: any)</ts.Declaration>;
    const inputExpression = props.part.optional ? (
      <>...({props.inputRef}.{partApplicationName} ?? [])</>
    ) : (
      <>...{props.inputRef}.{partApplicationName}</>
    );
    return <>
      {inputExpression}.map({xDec} {ay.code`=> (${<HttpPartExpression inputRef={xRef} part={{...props.part, multi: false}} />})`} )
    </>;
  }

  if (isFilePart(props.part)) {
    const defaultContentType = getDefaultContentType(props.part);
    const args: ay.Children = [partName, props.inputRef];
    if (defaultContentType) {
      args.push(ts.ValueExpression({ jsValue: defaultContentType }));
    }
    return <ts.FunctionCallExpression refkey={getCreateFilePartDescriptorReference()} args={args} />;
  }

  return <ts.ObjectExpression>
  <ts.ObjectProperty name="name" jsValue={partName} />,
  <ts.ObjectProperty name="body" value={<ef.TypeTransformCall target="transport" type={props.part.body.type} itemPath={["payload", partApplicationName]} />} />
  </ts.ObjectExpression>;
}

function isPartArray(part: HttpOperationPart) {
  return part.multi;
}

function isFilePart(part: HttpOperationPart) {
  return Boolean(part.filename);
}

export interface SingleBodyTransformDeclarationProps {
  operation: ClientOperation;
  payload: HttpOperationBody;
}

function getDefaultContentType(part: HttpOperationPart) {
  const contentTypes = part.body.contentTypes;
  if (contentTypes.length !== 1) {
    return undefined;
  }

  const contentType = contentTypes[0];

  if (!contentType || contentType === "*/*") {
    return undefined;
  }

  return contentType;
}
