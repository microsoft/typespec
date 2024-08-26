import { Child, mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { DateTimeKnownEncoding, Model, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ArraySerializerRefkey } from "./static-serializers.jsx";
import { buildArraySerializer, buildRecordSerializer, Serializer, SerializerExpression } from "./serializers-utils.jsx";


export interface ModelDeserializerProps {
  type: Model;
  name?: string;
}
export function ModelDeserializer(props: ModelDeserializerProps) {
  const namePolicy = ts.useTSNamePolicy();
  const modelName = namePolicy.getName(props.type.name, "function");

  const functionName = props.name ? props.name : `${modelName}Deserializer`;
  return (
    <ts.FunctionDeclaration export name={functionName} refkey={getDeserializerRefkey(props.type)}>
      <ts.FunctionDeclaration.Parameters
        parameters={{ item: "any" }}
      ></ts.FunctionDeclaration.Parameters>
      <>
        return <ts.ObjectExpression>
          {mapJoin(
            props.type.properties,
            (_, property) => {
              const propertyName = namePolicy.getName(property.name, "interface-member");
              const itemPath = `item.${property.name}`;
              return (
                <ts.ObjectProperty
                  name={propertyName}
                  value={Serializer(property.type, buildDeserializer, itemPath)}
                />
              );
            },
            { joiner: ",\n" }
          )}
        </ts.ObjectExpression>;
      </>
    </ts.FunctionDeclaration>
  );
}


function getDeserializerRefkey(type: Model) {
  return refkey(type, "deserializer");
}

function buildDeserializer(type: Type, itemPath: string):  SerializerExpression{
  switch (type.kind) {
    case "Model":
      if($.array.is(type)) {
       return buildArraySerializer(type, buildDeserializer, itemPath);
      }

      if($.record.is(type)) {
        return buildRecordSerializer(type, buildDeserializer, itemPath);
      }
      
      return (
        {serializer: (<>
          <ts.Reference refkey={getDeserializerRefkey(type)} />
        </>),
        params: itemPath}
      );
    case "Scalar":{
      if($.scalar.isUtcDateTime(type)) {
        const encoding = $.scalar.getEncoding(type) as DateTimeKnownEncoding | undefined;
        switch(encoding) {
          case "unixTimestamp":
            return {serializer:`new Date(${itemPath}* 1000)`, params: undefined};
          case "rfc3339":
          case "rfc7231":
          default:
            return {serializer:`new Date(${itemPath})`, params: undefined};
        }
      }
    }
    default:
      return undefined;
  }
}
