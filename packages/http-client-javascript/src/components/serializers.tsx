import * as ts from "@alloy-js/typescript";
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
import { TypeTransformDeclaration } from "./transforms/type-transform.jsx";

export interface ModelSerializersProps {
  path?: string;
}

export function ModelSerializers(props: ModelSerializersProps) {
  const clientLibrary = useClientLibrary();
  const dataTypes = clientLibrary.dataTypes;
  return <ts.SourceFile path={props.path ?? "serializers.ts"}>
      <RecordSerializer />
      <ArraySerializer />
      <DateDeserializer />
      <DateRfc7231Deserializer />
      <DateRfc3339Serializer />
      <DateRfc7231Serializer />
      <DateUnixTimestampSerializer />
      <DateUnixTimestampDeserializer />
      {dataTypes
        .filter((m) => m.kind === "Model")
        .map((type) => (
          <>
            <TypeTransformDeclaration type={type} target="transport" />
            <TypeTransformDeclaration type={type} target="application" />
          </>          
        ))}
    </ts.SourceFile>;
}
