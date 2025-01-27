import * as ts from "@alloy-js/typescript";
import * as ef from "@typespec/emitter-framework/typescript";
import {
  ArraySerializer,
  DateDeserializer,
  DateRfc3339Serializer,
  DateRfc7231Deserializer,
  DateRfc7231Serializer,
  DateUnixTimestampDeserializer,
  DateUnixTimestampSerializer,
  RecordSerializer,
} from "@typespec/emitter-framework/typescript";
import { useClientLibrary } from "@typespec/http-client-library";
import { flattenClients } from "../utils/client-discovery.js";
import { TransformDeclaration } from "./transforms/operation-transform-declaration.jsx";
export interface ModelSerializersProps {
  path?: string;
}

export function ModelSerializers(props: ModelSerializersProps) {
  const clientLibrary = useClientLibrary();
  const dataTypes = clientLibrary.dataTypes;
  const operations = flattenClients(clientLibrary.rootClient).flatMap((c) => c.operations);
  return <ts.SourceFile path={props.path ?? "serializers.ts"}>
      <RecordSerializer />
      <ArraySerializer />
      <DateDeserializer />
      <DateRfc7231Deserializer />
      <DateRfc3339Serializer />
      <DateRfc7231Serializer />
      <DateUnixTimestampSerializer />
      <DateUnixTimestampDeserializer />
      {operations.map(o => <TransformDeclaration operation={o} />)}
      {dataTypes
        .filter((m) => m.kind === "Model")
        .map((type) => (
          <>
            <ef.TypeTransformDeclaration type={type} target="transport" />
            <ef.TypeTransformDeclaration type={type} target="application" />
          </>          
        ))}
    </ts.SourceFile>;
}
