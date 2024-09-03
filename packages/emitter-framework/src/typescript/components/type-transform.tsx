import { mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";

export function getTypeTransformerRefkey(type: Model, target: "client" | "wire") {
  return refkey(type, target);
}

export interface ModelTransformExpressionProps {
  type: Model;
  itemPath: string;
  target: "client" | "wire";
}

export function ModelTransformExpression(props: ModelTransformExpressionProps) {
  const namePolicy = ts.useTSNamePolicy();
  return (
    <ts.ObjectExpression>
      {mapJoin(
        props.type.properties,
        (_, property) => {
          // assume "wire" target
          let targetPropertyName = property.name;
          let sourcePropertyName = namePolicy.getName(property.name, "interface-member");

          if (props.target === "client") {
            const temp = targetPropertyName;
            targetPropertyName = sourcePropertyName;
            sourcePropertyName = temp;
          }

          const itemPath = props.itemPath
            ? `${props.itemPath}.${sourcePropertyName}`
            : sourcePropertyName;
          return <ts.ObjectProperty name={targetPropertyName} value={itemPath} />;
        },
        { joiner: ",\n" }
      )}
    </ts.ObjectExpression>
  );
}

export interface TypeTransformProps {
  name?: string;
  type: Type;
  target: "client" | "wire";
}

export function TypeTransform(props: TypeTransformProps) {
  const namePolicy = ts.useTSNamePolicy();

  if (!$.model.is(props.type)) {
    return null;
  }

  const modelName = namePolicy.getName(
    props.name ?? $.model.getPlausibleName(props.type),
    "function"
  );
  const functionSuffix = props.target === "client" ? "ToClient" : "ToWire";
  const functionName = props.name ? props.name : `${modelName}${functionSuffix}`;
  return (
    <ts.FunctionDeclaration
      export
      name={functionName}
      refkey={getTypeTransformerRefkey(props.type, props.target)}
    >
      <ts.FunctionDeclaration.Parameters
        parameters={{ item: <ts.Reference refkey={refkey(props.type)} /> }}
      />
      return <ModelTransformExpression type={props.type} itemPath="item" target={props.target} />;
    </ts.FunctionDeclaration>
  );
}
