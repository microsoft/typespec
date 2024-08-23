import { mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, ModelProperty, getEncode } from "@typespec/compiler";
import {$} from "@typespec/compiler/typekit"

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
                  value={getSerializer(property, property.type, itemPath)}
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

function getSerializer(property: ModelProperty, type: Type, itemPath: string) {
  console.log("Prop encode", getEncode($.program, property));
  switch (type.kind) {
    case "Model":
      return (
        <>
          <ts.Reference refkey={getSerializerRefkey(type)} />({itemPath})
        </>
      );
    case "Scalar":{
      if($.scalar.isUtcDateTime(type) || $.scalar.extendsUtcDateTime(type)) {
        const encoding = getEncode($.program, property) ?? $.scalar.getEncoding(type);
        switch(encoding?.encoding) {
          case "rfc7231":
            return `${itemPath}.toUTCString()`;
          case "unixTimestamp":
            return `Math.floor(${itemPath}.getTime() / 1000)`;
          case "rfc3339":
          default:
            return `${itemPath}.toISOString()`;
        }
      }
    }
     
    default:
      return itemPath;
  }
}
