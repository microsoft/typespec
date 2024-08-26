import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { ModelSerializer } from "./model-serializer.js";
import { ModelDeserializer } from "./model-deserializer.js";
import { ArraySerializer, RecordSerializer } from "./static-serializers.jsx";

export interface ModelSerializersProps {
  types: Type[];
  path?: string;
}
export function ModelSerializers(props: ModelSerializersProps) {
  return (
    <ts.SourceFile path={props.path ?? "serializers.ts"}>
      <RecordSerializer />
      <ArraySerializer />
      {props.types
        .filter((m) => m.kind === "Model")
        .map((type) => (
          <>
            <ModelSerializer type={type} />
            <ModelDeserializer type={type} />
          </>          
        ))}
    </ts.SourceFile>
  );
}
