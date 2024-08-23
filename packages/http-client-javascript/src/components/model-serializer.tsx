import { mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Type } from "@typespec/compiler";

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
                  value={getSerializer(property.type, itemPath)}
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

function getSerializer(type: Type, itemPath: string) {
  switch (type.kind) {
    case "Model":
      return (
        <>
          <ts.Reference refkey={getSerializerRefkey(type)} />({itemPath})
        </>
      );
    default:
      return itemPath;
  }
}
