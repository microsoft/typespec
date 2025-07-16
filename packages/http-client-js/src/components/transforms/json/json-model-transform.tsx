import * as ts from "@alloy-js/typescript";

import { type Children, code, For, type Refkey, refkey } from "@alloy-js/core";
import type { Model } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { JsonAdditionalPropertiesTransform } from "./json-model-additional-properties-transform.jsx";
import { JsonModelPropertyTransform } from "./json-model-property-transform.jsx";
import { JsonRecordTransformDeclaration } from "./json-record-transform.jsx";
import {
  getJsonTransformDiscriminatorRefkey,
  JsonTransformDiscriminatorDeclaration,
} from "./json-transform-discriminator.jsx";

export interface JsonModelTransformProps {
  itemRef: Refkey | Children;
  type: Model;
  target: "transport" | "application";
}

export function JsonModelTransform(props: JsonModelTransformProps) {
  const { $ } = useTsp();
  // Need to skip never properties
  const properties = Array.from(
    $.model.getProperties(props.type, { includeExtended: true }).values(),
  ).filter((p) => !$.type.isNever(p.type));

  const discriminator = $.model.getDiscriminatedUnion(props.type);

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
      <For each={properties} joiner="," line>
        {(property) => {
          return (
            <JsonModelPropertyTransform
              itemRef={props.itemRef}
              type={property}
              target={props.target}
            />
          );
        }}
      </For>
    </ts.ObjectExpression>
  );
}

export function getJsonModelTransformRefkey(
  type: Model,
  target: "transport" | "application",
): Refkey {
  return refkey(type, "json_model_transform", target);
}

export interface JsonModelTransformDeclarationProps {
  type: Model;
  target: "transport" | "application";
}

export function JsonModelTransformDeclaration(props: JsonModelTransformDeclarationProps): Children {
  const { $ } = useTsp();
  const namePolicy = ts.useTSNamePolicy();
  const transformName = namePolicy.getName(
    `json_${props.type.name}_to_${props.target}_transform`,
    "function",
  );

  const returnType = props.target === "transport" ? "any" : refkey(props.type);
  const inputType = props.target === "transport" ? <>{refkey(props.type)} | null</> : "any";
  const inputRef = refkey();

  const parameters: ts.ParameterDescriptor[] = [
    // Make the input optional to make the transform more robust and check against null and undefined
    { name: "input_", type: inputType, refkey: inputRef, optional: true },
  ];

  const indexType = $.model.getIndexType(props.type);
  const hasAdditionalProperties = indexType && $.record.is(indexType);

  const declarationRefkey = getJsonModelTransformRefkey(props.type, props.target);
  return (
    <>
      {hasAdditionalProperties ? (
        <JsonRecordTransformDeclaration target={props.target} type={indexType} />
      ) : null}
      <JsonTransformDiscriminatorDeclaration type={props.type} target={props.target} />
      <ts.FunctionDeclaration
        name={transformName}
        export
        returnType={returnType}
        parameters={parameters}
        refkey={declarationRefkey}
      >
        {code`
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
