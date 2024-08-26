import { Child, mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, ModelProperty, Type, getEncode } from "@typespec/compiler";
import {$} from "@typespec/compiler/typekit"
import { ArraySerializerRefkey } from "./static-serializers.jsx";
import { buildArraySerializer, buildRecordSerializer, BuildSerializerOptions, Serializer, SerializerExpression } from "./serializers-utils.jsx";

export interface ModelSerializerProps {
  type: Model;
  name?: string;
}
export function ModelSerializer(props: ModelSerializerProps) {
  const namePolicy = ts.useTSNamePolicy();
  const modelName = namePolicy.getName(props.type.name, "function");

  const functionName = props.name ? props.name : `${modelName}Serializer`;
  return (
    <ts.FunctionDeclaration export name={functionName} refkey={getSerializerRefkey(props.type)}>
      <ts.FunctionDeclaration.Parameters
        parameters={{ item: <ts.Reference refkey={refkey(props.type)} /> }}
      ></ts.FunctionDeclaration.Parameters>
      <>
        return <ts.ObjectExpression>
          {mapJoin(
            props.type.properties,
            (_, property) => {
              const itemPath = `item.${namePolicy.getName(property.name, "interface-member")}`;
              return (
                <ts.ObjectProperty
                  name={property.name}
                  // TODO: Alloy to support ref to interface properties
                  // value={<ts.Reference refkey={refkey(property)} />}
                  value={Serializer(property.type, buildSerializer, itemPath, {wrapperEncoding: getEncode($.program, property)})}
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

function getSerializerRefkey(type: Model) {
  return refkey(type, "serializer");
}

function buildSerializer(type: Type, itemPath: string, options: BuildSerializerOptions = {}): SerializerExpression {
  switch (type.kind) {
    case "Model":
      if($.array.is(type)) {
        return buildArraySerializer(type, buildSerializer, itemPath, options);
      }

      if($.record.is(type)) {
        return buildRecordSerializer(type, buildSerializer, itemPath, options);
      }
      
      return {
        serializer:(<ts.Reference refkey={getSerializerRefkey(type)} />),
        params: itemPath
      }
      
    case "Scalar":{
      if($.scalar.isUtcDateTime(type) || $.scalar.extendsUtcDateTime(type)) {
        const encoding = options.wrapperEncoding ?? $.scalar.getEncoding(type);
        switch(encoding?.encoding) {
          case "rfc7231":
            return {serializer: `${itemPath}.toUTCString()`}
          case "unixTimestamp":
            return {serializer: `Math.floor(${itemPath}.getTime() / 1000)`}
          case "rfc3339":
          default:
            return {serializer: `${itemPath}.toISOString()`}
        }
      }
    }
     
    default:
      return undefined;
  }
}
