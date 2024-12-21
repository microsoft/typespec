import { Children, code, mapJoin, Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Discriminator, Model, ModelProperty, Scalar, Type, Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {
  ArraySerializerRefkey,
  DateDeserializerRefkey,
  DateRfc3339SerializerRefkey,
  RecordSerializerRefkey,
} from "./static-serializers.jsx";
import { reportTypescriptDiagnostic } from "../../typescript/lib.js";


export interface TypeTransformProps {
  name?: string;
  type: Type;
  target: "application" | "transport";
}


export interface UnionTransformProps {
  name?: string;
  type: Union;
  target: "application" | "transport";
}
function UnionTransformExpression(props: UnionTransformProps) {
  const discriminator = $.type.getDiscriminator(props.type);

  if(!discriminator) {
    // TODO: Handle non-discriminated unions
    reportTypescriptDiagnostic($.program, {
      code: "typescript-unsupported-nondiscriminated-union",
      target: props.type,
    })
    return null;
  }

  return <DiscriminateExpression type={props.type} discriminator={discriminator} target={props.target} />;
}

interface DiscriminateExpressionProps {
  type: Union | Model;
  discriminator: Discriminator;
  target: "application" | "transport";
}

function DiscriminateExpression(props: DiscriminateExpressionProps) {
  
  const discriminatedUnion = $.type.getDiscriminatedUnion(props.type)!;

  const unhandledVariant = `\n\nthrow new Error(\`Unexpected discriminated variant $\{item.${props.discriminator.propertyName}}\`);`;

  return mapJoin(discriminatedUnion.variants, (name, variant) => {
    return code`
    if(item.${props.discriminator.propertyName} === ${JSON.stringify(name)}) {
      return ${<TypeTransformCall type={variant.type} target={props.target} castInput itemPath={["item"]}/>}
    }
    `
  }, { joiner: "\n\n", ender: unhandledVariant });

}

/**
 * Component that represents a function declaration that transforms a model to a transport or application model.
 */
export function TypeTransformDeclaration(props: TypeTransformProps) {
  const namePolicy = ts.useTSNamePolicy();

  // TODO: Handle other type of declarations
  if (!$.model.is(props.type) && !$.union.is(props.type)) {
    return null;
  }

  const baseName = namePolicy.getName(
    props.name ?? $.type.getPlausibleName(props.type),
    "function"
  );
  const functionSuffix = props.target === "application" ? "ToApplication" : "ToTransport";
  const functionName = props.name ? props.name : `${baseName}${functionSuffix}`;
  const itemType = props.target === "application" ? "any" : <ts.Reference refkey={refkey(props.type)} />;

  let transformExpression: Children;
  if($.model.is(props.type)) {
    const discriminator = $.type.getDiscriminator(props.type);
  
      transformExpression = discriminator ?
       <DiscriminateExpression type={props.type} discriminator={discriminator} target={props.target} /> : 
      <>return <ModelTransformExpression  type={props.type} itemPath={["item"]} target={props.target} />;</> 
  } else if($.union.is(props.type)) {
  transformExpression = <UnionTransformExpression type={props.type} target={props.target} />;
  } else {
    reportTypescriptDiagnostic($.program, {
      code: "typescript-unsupported-type-transform",
      target: props.type,
    }) 
  }

  const returnType = props.target === "application" ? refkey(props.type) : "any";


  return (
    <ts.FunctionDeclaration
      export
      name={functionName}
      refkey={getTypeTransformerRefkey(props.type, props.target)}
      parameters={{ item: itemType }}
      returnType={returnType}
    >
      {transformExpression}
    </ts.FunctionDeclaration>
  );
}


/**
 * Gets a refkey for a TypeTransformer function
 * @param type type to be transformed
 * @param target target of the transformation "application" or "transport"
 * @returns the refkey for the TypeTransformer function
 */
export function getTypeTransformerRefkey(type: Type, target: "application" | "transport") {
  return refkey(type, target);
}


export interface ModelTransformExpressionProps {
  type: Model;
  itemPath?: string[];
  target: "application" | "transport";
  optionsBagName?: string;
}

/**
 * Component that represents an object expression that transforms a model to a transport or application model.
 */
export function ModelTransformExpression(props: ModelTransformExpressionProps) {
  if(props.type.baseModel) {
    reportTypescriptDiagnostic($.program, {
      code: "typescript-extended-model-transform-nyi",
      target: props.type,
    })
  }

  if($.model.getSpreadType(props.type)) { 
    reportTypescriptDiagnostic($.program, {
      code: "typescript-spread-model-transofrmation-nyi",
      target: props.type,
    })
  }
  const namePolicy = ts.useTSNamePolicy();
  const modelProperties = $.model.getProperties(props.type);
  
  let baseModelTransform: Children = null;
  if(props.type.baseModel) {
    baseModelTransform = code`...${<TypeTransformCall type={props.type.baseModel} itemPath={props.itemPath} target={props.target} optionsBagName={props.optionsBagName} />},\n`
  }
  
  return (
    <ts.ObjectExpression>
      {baseModelTransform}
      {mapJoin(
        modelProperties,
        (_, property) => {
          // assume "transport" target
          let targetPropertyName = property.name;
          let sourcePropertyName = namePolicy.getName(property.name, "interface-member");

          if (props.target === "application") {
            const temp = targetPropertyName;
            targetPropertyName = sourcePropertyName;
            sourcePropertyName = temp;
          }

          const itemPath = [...(props.itemPath ?? []), sourcePropertyName];
          if(property.optional && props.optionsBagName) {
            itemPath.unshift(`${props.optionsBagName}?`);
          }

          let value = <TypeTransformCall target={props.target} type={property.type} itemPath={itemPath} />

          if(property.optional && needsTransform(property.type)) {
            value = <>{itemPath.join(".")} ? <TypeTransformCall target={props.target} type={property.type} itemPath={itemPath} /> : {itemPath.join(".")}</>
          }

          return <ts.ObjectProperty name={JSON.stringify(targetPropertyName)} value={value} />;
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
  /**
   * TypeSpec type to be transformed
   */
  type: Type;
  /**
   * 
   */
  castInput?: boolean;
  /**
   * Transformation target
   */
  target: "application" | "transport";
  /**
   * When type is a model with a single property, collapses the model to the property.
   */
  collapse?: boolean,
  /**
   * Path of the item to be transformed
   */
  itemPath?: string[];
  /**
   * Name of the options bag to be used when transforming optional properties
   */
  optionsBagName?: string;
}

function needsTransform(type: Type): boolean {
  return $.model.is(type)   || $.scalar.isUtcDateTime(type)
}

/**
 * This component represents a function call to transform a type
 */
export function TypeTransformCall(props: TypeTransformCallProps) {
  const collapsedProperty = getCollapsedProperty(props.type, props.collapse ?? false);
  const itemPath = collapsedProperty ? [...(props.itemPath ?? []), collapsedProperty.name] : props.itemPath ?? [];
  if(collapsedProperty?.optional) {
    itemPath.unshift(`${props.optionsBagName}?`);
  }
  let itemName: Children = itemPath.join(".");
  if(props.castInput) {
    itemName = code`${itemName} as ${refkey(props.type)}`;
  }
  const transformType = collapsedProperty?.type ?? props.type;
  if ($.array.is(transformType)) {
    return (
      <ts.FunctionCallExpression
        refkey={ArraySerializerRefkey}
        args={[
          itemName,
          <TransformReference target={props.target} type={$.array.getElementType(transformType)} />,
        ]}
      />
    );
  }

  if ($.record.is(transformType)) {
    return (
      <ts.FunctionCallExpression
        refkey={RecordSerializerRefkey}
        args={[
          itemName,
          <TransformReference target={props.target} type={$.record.getElementType(transformType)} />,
        ]}
      />
    );
  }

  if($.scalar.isUtcDateTime(transformType)) {
    return <ts.FunctionCallExpression refkey={props.target === "application" ? DateDeserializerRefkey : DateRfc3339SerializerRefkey} args={[itemName]} />
  }

  if ($.model.is(transformType)) {
    if($.model.isExpresion(transformType)) {
      const effectiveModel = $.model.getEffectiveModel(transformType);
      
      return <ModelTransformExpression type={effectiveModel} itemPath={itemPath} target={props.target} optionsBagName={props.optionsBagName} />;
    }
    return <ts.FunctionCallExpression refkey={ getTypeTransformerRefkey(transformType, props.target)} args={[itemName]} />
  }

  return itemName;
}

function getCollapsedProperty(model: Type, collapse: boolean): ModelProperty | undefined {
  if(!$.model.is(model)) {
    return undefined;
  }

  const modelProperties = $.model.getProperties(model);
  if (collapse && modelProperties.size === 1) {
    return Array.from(modelProperties.values())[0];
  }
  return undefined;
}
