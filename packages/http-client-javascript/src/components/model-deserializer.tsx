import { mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Type } from "@typespec/compiler";


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
                  value={getDeserializer(property.type, itemPath)}
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

function getDeserializer(type: Type, input: string) {
  switch (type.kind) {
    case "Model":
      return (
        <>
          <ts.Reference refkey={getDeserializerRefkey(type)} />({input})
        </>
      );
    default:
      return input;
  }
}
