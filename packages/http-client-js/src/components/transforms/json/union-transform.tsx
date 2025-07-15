import { Children, code, refkey, Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Union } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import {
  getJsonTransformDiscriminatorRefkey,
  JsonTransformDiscriminatorDeclaration,
} from "./json-transform-discriminator.jsx";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonUnionTransformProps {
  itemRef: Refkey | Children;
  type: Union;
  target: "transport" | "application";
}

export function JsonUnionTransform(props: JsonUnionTransformProps) {
  const { $ } = useTsp();
  const discriminator = $.union.getDiscriminatedUnion(props.type);
  if (discriminator?.options.discriminatorPropertyName) {
    // return <JsonTransformDiscriminator {...props} discriminator={discriminator}/>;
    return (
      <>
        {getJsonTransformDiscriminatorRefkey(props.type, props.target)}({props.itemRef})
      </>
    );
  }

  const variantType = props.type.variants.values().next().value!.type;

  if (!$.union.isExtensible(props.type)) {
    return props.itemRef;
  }

  // TODO: Handle non-discriminated unions
  return <JsonTransform {...props} type={variantType} />;
}

export function getJsonUnionTransformRefkey(
  type: Union,
  target: "transport" | "application",
): Refkey {
  return refkey(type, "json_union_transform", target);
}
export interface JsonUnionTransformDeclarationProps {
  type: Union;
  target: "transport" | "application";
}

export function JsonUnionTransformDeclaration(props: JsonUnionTransformDeclarationProps) {
  const namePolicy = ts.useTSNamePolicy();
  const transformName = namePolicy.getName(
    `json_${props.type.name}_to_${props.target}_transform`,
    "function",
  );

  const typeRef = refkey(props.type);
  const returnType = props.target === "transport" ? "any" : typeRef;
  const inputType = props.target === "transport" ? <>{typeRef} | null</> : "any";
  const inputRef = refkey();

  const parameters: ts.ParameterDescriptor[] = [
    { name: "input_", type: inputType, refkey: inputRef, optional: true },
  ];

  const declarationRefkey = getJsonUnionTransformRefkey(props.type, props.target);
  return (
    <>
      <JsonTransformDiscriminatorDeclaration target={props.target} type={props.type} />
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
        return <JsonUnionTransform {...props} itemRef={inputRef} />
      </ts.FunctionDeclaration>
    </>
  );
}
