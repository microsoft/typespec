import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import {
  getJsonTransformDiscriminatorRefkey,
  JsonTransformDiscriminatorDeclaration,
} from "./json-transform-discriminator.jsx";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonUnionTransformProps {
  itemRef: ay.Refkey | ay.Children;
  type: Union;
  target: "transport" | "application";
}

export function JsonUnionTransform(props: JsonUnionTransformProps) {
  const discriminator = $.type.getDiscriminator(props.type);
  if (discriminator) {
    // return <JsonTransformDiscriminator {...props} discriminator={discriminator}/>;
    return <>{getJsonTransformDiscriminatorRefkey(props.type, props.target)}({props.itemRef})</>;
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
): ay.Refkey {
  return ay.refkey(type, "json_union_transform", target);
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

  const typeRef = ay.refkey(props.type);
  const returnType = props.target === "transport" ? "any" : typeRef;
  const inputType = props.target === "transport" ? <>{typeRef} | null</> : "any";
  const inputRef = ay.refkey();

  const parameters: Record<string, ts.ParameterDescriptor> = {
    input_: { type: inputType, refkey: inputRef, optional: true },
  };

  const declarationRefkey = getJsonUnionTransformRefkey(props.type, props.target);
  return <>
  <JsonTransformDiscriminatorDeclaration target={props.target} type={props.type} />
  <ts.FunctionDeclaration name={transformName} export returnType={returnType} parameters={parameters} refkey={declarationRefkey} >
    {ay.code`
    if(!${inputRef}) {
      return ${inputRef} as any;
    }
    `}
    return <JsonUnionTransform {...props} itemRef={inputRef} />
  </ts.FunctionDeclaration>
  </>;
}
