import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import {
  ArraySerializer,
  DateDeserializer,
  DateRfc3339Serializer,
  DateRfc7231Deserializer,
  DateRfc7231Serializer,
  DateUnixTimestampDeserializer,
  DateUnixTimestampSerializer,
  RecordSerializer,
  TypeTransformDeclaration,
} from "@typespec/emitter-framework/typescript";

export interface ModelSerializersProps {
  types: Type[];
  path?: string;
}
export function ModelSerializers(props: ModelSerializersProps) {
  return <ts.SourceFile path={props.path ?? "serializers.ts"}>
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
    </ts.SourceFile>;
}
