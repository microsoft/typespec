import { mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Type } from "@typespec/compiler";

export interface ModelSerializersProps {
  types: Type[];
  path?: string;
}
export function ModelSerializers(props: ModelSerializersProps) {
  return (
    <ts.SourceFile path={props.path ?? "serializers.ts"}>
      {props.types
        .filter((m) => m.kind === "Model")
        .map((type) => (
          <ModelSerializer type={type} />
        ))}
    </ts.SourceFile>
  );
}

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
        parameters={{ input: <ts.Reference refkey={refkey(props.type)} /> }}
      ></ts.FunctionDeclaration.Parameters>
      <>
        return <ts.ObjectExpression>
          {mapJoin(
            props.type.properties,
            (_, property) => {
              const inputProperty = `input.${namePolicy.getName(property.name, "interface-member")}`;
              return (
                <ts.ObjectProperty
                  name={property.name}
                  // TODO: Alloy to support ref to interface properties
                  // value={<ts.Reference refkey={refkey(property)} />}
                  value={getSerializer(property.type, inputProperty)}
                />
              );
            },
            { joiner: ",\n" }
          )}
        </ts.ObjectExpression>
      </>
    </ts.FunctionDeclaration>
  );
}

function getSerializerRefkey(type: Model) {
  return refkey(type, "serializer");
}

function getSerializer(type: Type, input: string) {
  switch (type.kind) {
    case "Model":
      return (
        <>
          <ts.Reference refkey={getSerializerRefkey(type)} />({input})
        </>
      );
    default:
      return input;
  }
}
