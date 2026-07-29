import * as ts from "@alloy-js/typescript";
import type { Type } from "@typespec/compiler";
import { type Typekit } from "@typespec/compiler/typekit";
import { useTsp } from "@typespec/emitter-framework";
import {
  DateDeserializer,
  DateRfc3339Serializer,
  DateRfc7231Deserializer,
  DateRfc7231Serializer,
  DateUnixTimestampDeserializer,
  DateUnixTimestampSerializer,
} from "@typespec/emitter-framework/typescript";
import { useClientLibrary } from "@typespec/http-client";
import { flattenClients } from "../utils/client-discovery.js";
import { EncodingProvider } from "./encoding-provider.jsx";
import { DecodeBase64, EncodeUint8Array } from "./static-helpers/bytes-encoding.jsx";
import { JsonTransformDeclaration } from "./transforms/json/json-transform.jsx";
import { TransformDeclaration } from "./transforms/operation-transform-declaration.jsx";
export interface ModelSerializersProps {
  path?: string;
}

export function ModelSerializers(props: ModelSerializersProps) {
  const { $ } = useTsp();
  const clientLibrary = useClientLibrary();
  const dataTypes = clientLibrary.dataTypes;
  const flatClients = clientLibrary.topLevel.flatMap((c) => flattenClients(c));
  const operations = flatClients.flatMap((c) => c.operations);
  // Todo: Handle other kinds of serialization, for example XML. Might need to
  // revisit the way we process these and might need to track the relationship
  // between the data type and the operations that consume them.
  return (
    <ts.SourceFile path={props.path ?? "serializers.ts"}>
      <DecodeBase64 />
      <EncodeUint8Array />
      <DateDeserializer />
      <DateRfc7231Deserializer />
      <DateRfc3339Serializer />
      <DateRfc7231Serializer />
      <DateUnixTimestampSerializer />
      <DateUnixTimestampDeserializer />
      {operations.map((o) => (
        <TransformDeclaration operation={o} />
      ))}
      {dataTypes
        .filter((m) => m.kind === "Model" || m.kind === "Union")
        .map((type) => {
          let bytesDefaultEncoding: "base64" | "none" = "base64";
          if (isOrExtendsFile($, type)) {
            bytesDefaultEncoding = "none";
          }

          return (
            <EncodingProvider defaults={{ bytes: bytesDefaultEncoding }}>
              <JsonTransformDeclaration type={type} target="transport" />
              <JsonTransformDeclaration type={type} target="application" />
            </EncodingProvider>
          );
        })}
    </ts.SourceFile>
  );
}

function isOrExtendsFile($: Typekit, type: Type): boolean {
  if (!$.model.is(type)) {
    return false;
  }

  if ($.model.isHttpFile(type)) {
    return true;
  }

  return type.baseModel ? isOrExtendsFile($, type.baseModel) : false;
}
