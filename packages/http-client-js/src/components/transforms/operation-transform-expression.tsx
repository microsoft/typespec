import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { HasName, TransformNamePolicyContext } from "@typespec/emitter-framework";
import { ClientOperation } from "@typespec/http-client";
import { reportDiagnostic } from "../../lib.js";
import { ContentTypeEncodingProvider } from "./content-type-encoding-provider.jsx";
import { JsonTransform } from "./json/json-transform.jsx";
import { MultipartTransform } from "./multipart/multipart-transform.jsx";
import { defaultTransportNameGetter } from "./transform-name-policy.js";

export interface OperationTransformToTransportExpression {
  operation: ClientOperation;
}

export function OperationTransformExpression(props: OperationTransformToTransportExpression) {
  const body = props.operation.httpOperation.parameters.body;

  if (!body) {
    return;
  }

  const itemRef = body.property ? payloadApplicationNameGetter(body.property) : null;

  if (body.bodyKind === "multipart") {
    return <MultipartTransform body={body} />;
  }

  // TODO: Handle content types other than application/json and multipart
  // And multiple content types
  const contentType = body.contentTypes[0];
  const payloadType = body.type;
  return (
    <ContentTypeEncodingProvider contentType={contentType}>
      <TransformNamePolicyContext.Provider
        value={{
          getTransportName: defaultTransportNameGetter,
          getApplicationName: payloadApplicationNameGetter,
        }}
      >
        <JsonTransform itemRef={itemRef} target="transport" type={payloadType} />
      </TransformNamePolicyContext.Provider>
    </ContentTypeEncodingProvider>
  );
}

function payloadApplicationNameGetter(type: HasName<Type>) {
  if (typeof type.name !== "string") {
    reportDiagnostic($.program, { code: "symbol-name-not-supported", target: type });
    return "";
  }

  const namePolicy = ts.useTSNamePolicy();
  let name = namePolicy.getName(type.name, "object-member-data");

  if ($.modelProperty.is(type) && type.optional) {
    name = `options?.${name}`;
  }

  return name;
}
