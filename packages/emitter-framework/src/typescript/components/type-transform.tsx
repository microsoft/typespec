import { code, mapJoin, Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Scalar, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {
  ArraySerializerRefkey,
  DateDeserializerRefkey,
  DateRfc3339SerializerRefkey,
  RecordSerializerRefkey,
} from "./static-serializers.jsx";


export interface TypeTransformProps {
  name?: string;
  type: Type;
  target: "application" | "transport";
}

/**
 * Component that represents a function declaration that transforms a model to a transport or application model.
 */
export function TypeTransformDeclaration(props: TypeTransformProps) {
  const namePolicy = ts.useTSNamePolicy();

  // TODO: Handle other type of declarations
  if (!$.model.is(props.type)) {
    return null;
  }

  const modelName = namePolicy.getName(
    props.name ?? $.model.getPlausibleName(props.type),
    "function"
  );
  const functionSuffix = props.target === "application" ? "ToApplication" : "ToTransport";
  const functionName = props.name ? props.name : `${modelName}${functionSuffix}`;
  const itemType = props.target === "application" ? "any" : <ts.Reference refkey={refkey(props.type)} />;
  return (
    <ts.FunctionDeclaration
      export
      name={functionName}
      refkey={getTypeTransformerRefkey(props.type, props.target)}
      parameters={{ item: itemType }}
    >
      return <ModelTransformExpression type={props.type} itemPath="item" target={props.target} />;
    </ts.FunctionDeclaration>
  );
}


/**
 * Gets a refkey for a TypeTransformer function
 * @param type type to be transformed
 * @param target target of the transformation "application" or "transport"
 * @returns the refkey for the TypeTransformer function
 */
export function getTypeTransformerRefkey(type: Model, target: "application" | "transport") {
  return refkey(type, target);
}


export interface ModelTransformExpressionProps {
  type: Model;
  itemPath: string;
  target: "application" | "transport";
}

/**
 * Component that represents an object expression that transforms a model to a transport or application model.
 */
export function ModelTransformExpression(props: ModelTransformExpressionProps) {
  const namePolicy = ts.useTSNamePolicy();
  return (
    <ts.ObjectExpression>
      {mapJoin(
        props.type.properties,
        (_, property) => {
          // assume "transport" target
          let targetPropertyName = property.name;
          let sourcePropertyName = namePolicy.getName(property.name, "interface-member");

          if (props.target === "application") {
            const temp = targetPropertyName;
            targetPropertyName = sourcePropertyName;
            sourcePropertyName = temp;
          }

          const itemPath = props.itemPath
            ? `${props.itemPath}.${sourcePropertyName}`
            : sourcePropertyName;
          return <ts.ObjectProperty name={JSON.stringify(targetPropertyName)} value={<TypeTransformCall target={props.target} type={property.type} itemName={itemPath} />} />;
        },
        { joiner: ",\n" }
      )}
    </ts.ObjectExpression>
  );
}

interface TransformReferenceProps {
  type: Type;
  target: "application" | "transport";
}

/**
 * Given a type and target, gets the reference to the transform function
 */
function TransformReference(props: TransformReferenceProps) {
  if ($.scalar.is(props.type)) {
    return <TransformScalarReference type={props.type} target={props.target} />;
  }

  if ($.array.is(props.type)) {
    return code`
  (i: any) => ${(<ts.FunctionCallExpression refkey={ArraySerializerRefkey} args={["i", <TransformReference target={props.target} type={$.array.getElementType(props.type)} />]} />)}
    `;
  }

  if ($.record.is(props.type)) {
    return code`
  (i: any) => ${(<ts.FunctionCallExpression refkey={RecordSerializerRefkey} args={["i", <TransformReference target={props.target} type={$.record.getElementType(props.type)} />]} />)}
    `;
  }

  if($.model.is(props.type)) {
    return <ts.Reference refkey={getTypeTransformerRefkey(props.type, props.target)} />;
  }
}

interface TransformScalarReferenceProps {
  type: Scalar;
  target: "application" | "transport";
}

/**
 * Handles scalar transformations
 */
function TransformScalarReference(props: TransformScalarReferenceProps) {
  let reference: Refkey | undefined;
  if ($.scalar.isUtcDateTime(props.type)) {
    // TODO: Handle encoding, likely to need access to parents to avoid passing the modelProperty
    reference = props.target === "application" ? DateDeserializerRefkey : DateRfc3339SerializerRefkey;
  }

  if (reference) {
    return <ts.Reference refkey={reference} />;
  } else {
    return null;
  }
}

export interface TypeTransformCallProps {
  type: Type;
  target: "application" | "transport";
  itemName?: string;
}

/**
 * This component represents a function call to transform a type
 */
export function TypeTransformCall(props: TypeTransformCallProps) {
  const itemName = props.itemName ?? "item";
  if ($.array.is(props.type)) {
    return (
      <ts.FunctionCallExpression
        refkey={ArraySerializerRefkey}
        args={[
          itemName,
          <TransformReference target={props.target} type={$.array.getElementType(props.type)} />,
        ]}
      />
    );
  }

  if ($.record.is(props.type)) {
    return (
      <ts.FunctionCallExpression
        refkey={RecordSerializerRefkey}
        args={[
          itemName,
          <TransformReference target={props.target} type={$.record.getElementType(props.type)} />,
        ]}
      />
    );
  }

  if($.scalar.isUtcDateTime(props.type)) {
    return <ts.FunctionCallExpression refkey={props.target === "application" ? DateDeserializerRefkey : DateRfc3339SerializerRefkey} args={[itemName]} />
  }

  if ($.model.is(props.type)) {
    return <ts.FunctionCallExpression refkey={ getTypeTransformerRefkey(props.type, props.target)} args={[props.itemName]} />
  }

  return props.itemName;
}
