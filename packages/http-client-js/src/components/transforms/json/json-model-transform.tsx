import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { JsonAdditionalPropertiesTransform } from "./json-model-additional-properties-transform.jsx";
import { JsonModelPropertyTransform } from "./json-model-property-transform.jsx";
import { JsonRecordTransformDeclaration } from "./json-record-transform.jsx";
import {
  getJsonTransformDiscriminatorRefkey,
  JsonTransformDiscriminatorDeclaration,
} from "./json-transform-discriminator.jsx";

export interface JsonModelTransformProps {
  itemRef: ay.Refkey | ay.Children;
  type: Model;
  target: "transport" | "application";
}

export function JsonModelTransform(props: JsonModelTransformProps) {
  // Need to skip never properties
  const properties = Array.from(
    $.model.getProperties(props.type, { includeExtended: true }).values(),
  ).filter((p) => !$.type.isNever(p.type));

  const discriminator = $.type.getDiscriminator(props.type);

  const discriminate = getJsonTransformDiscriminatorRefkey(props.type, props.target);

  return (
    <ts.ObjectExpression>
      <JsonAdditionalPropertiesTransform
        itemRef={props.itemRef}
        target={props.target}
        type={props.type}
      />
      {discriminator ? (
        <>
          ...{discriminate}({props.itemRef}),
        </>
      ) : null}
      <ay.For each={properties} joiner="," line>
        {(property) => {
          return (
            <JsonModelPropertyTransform
              itemRef={props.itemRef}
              type={property}
              target={props.target}
            />
          );
        }}
      </ay.For>
    </ts.ObjectExpression>
  );
}

export function getJsonModelTransformRefkey(
  type: Model,
  target: "transport" | "application",
): ay.Refkey {
  return ay.refkey(type, "json_model_transform", target);
}

export interface JsonModelTransformDeclarationProps {
  type: Model;
  target: "transport" | "application";
}

export function JsonModelTransformDeclaration(
  props: JsonModelTransformDeclarationProps,
): ay.Children {
  const namePolicy = ts.useTSNamePolicy();
  const transformName = namePolicy.getName(
    `json_${props.type.name}_to_${props.target}_transform`,
    "function",
  );

  const returnType = props.target === "transport" ? "any" : ay.refkey(props.type);
  const inputType = props.target === "transport" ? <>{ay.refkey(props.type)} | null</> : "any";
  const inputRef = ay.refkey();

  const parameters: Record<string, ts.ParameterDescriptor> = {
    // Make the input optional to make the transform more robust and check against null and undefined
    input_: { type: inputType, refkey: inputRef, optional: true },
  };

  const spread = $.model.getSpreadType(props.type);
  const hasAdditionalProperties = spread && $.model.is(spread) && $.record.is(spread);

  const declarationRefkey = getJsonModelTransformRefkey(props.type, props.target);
  return (
    <>
      {hasAdditionalProperties ? (
        <JsonRecordTransformDeclaration target={props.target} type={spread} />
      ) : null}
      <JsonTransformDiscriminatorDeclaration type={props.type} target={props.target} />
      <ts.FunctionDeclaration
        name={transformName}
        export
        returnType={returnType}
        parameters={parameters}
        refkey={declarationRefkey}
      >
        {ay.code`
      if(!${inputRef}) {
        return ${inputRef} as any;
      }
        
      `}
        return <JsonModelTransform {...props} itemRef={inputRef} />
        !;
      </ts.FunctionDeclaration>
    </>
  );
}
