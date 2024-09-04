import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { ArraySerializer, RecordSerializer, TypeTransformDeclaration, DateDeserializer, DateRfc7231Deserializer, DateRfc3339Serializer, DateRfc7231Serializer, DateUnixTimestampSerializer, DateUnixTimestampDeserializer } from "@typespec/emitter-framework/typescript"

export interface ModelSerializersProps {
  types: Type[];
  path?: string;
}
export function ModelSerializers(props: ModelSerializersProps) {
  return (
    <ts.SourceFile path={props.path ?? "serializers.ts"}>
      <RecordSerializer />
      <ArraySerializer />
      <DateDeserializer />
      <DateRfc7231Deserializer />
      <DateRfc3339Serializer />
      <DateRfc7231Serializer />
      <DateUnixTimestampSerializer />
      <DateUnixTimestampDeserializer />
      {props.types
        .filter((m) => m.kind === "Model")
        .map((type) => (
          <>
            <TypeTransformDeclaration type={type} target="transport" />
            <TypeTransformDeclaration type={type} target="application" />
          </>          
        ))}
    </ts.SourceFile>
  );
}
