import type { Children, Refkey } from "@alloy-js/core";
import { code, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Union } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import {
  getSerializerTransformFunctionPrefix,
  getUnionTransformRefkey,
  type SerializerTransformKind,
} from "../../../utils/serializer-transform.js";
import {
  getJsonTransformDiscriminatorRefkey,
  JsonTransformDiscriminatorDeclaration,
} from "./json-transform-discriminator.jsx";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonUnionTransformProps {
  itemRef: Refkey | Children;
  type: Union;
  target: "transport" | "application";
  serializerKind?: SerializerTransformKind;
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
  const serializationMediaType =
    props.serializerKind === "form_urlencoded" ? "application/x-www-form-urlencoded" : undefined;

  if (!$.union.isExtensible(props.type)) {
    return props.itemRef;
  }

  // TODO: Handle non-discriminated unions
  return (
    <JsonTransform
      {...props}
      type={variantType}
      serializationMediaType={serializationMediaType}
    />
  );
}

export function getJsonUnionTransformRefkey(
  type: Union,
  target: "transport" | "application",
  kind: SerializerTransformKind = "json",
): Refkey {
  return getUnionTransformRefkey(type, target, kind);
}
export interface JsonUnionTransformDeclarationProps {
  type: Union;
  target: "transport" | "application";
  serializerKind?: SerializerTransformKind;
}

export function JsonUnionTransformDeclaration(props: JsonUnionTransformDeclarationProps) {
  const serializerKind = props.serializerKind ?? "json";
  const namePolicy = ts.useTSNamePolicy();
  const transformName = namePolicy.getName(
    `${getSerializerTransformFunctionPrefix(serializerKind)}_${props.type.name}_to_${props.target}_transform`,
    "function",
  );

  const typeRef = refkey(props.type);
  const returnType = props.target === "transport" ? "any" : typeRef;
  const inputType = props.target === "transport" ? <>{typeRef} | null</> : "any";
  const inputRef = refkey();

  const parameters: ts.ParameterDescriptor[] = [
    { name: "input_", type: inputType, refkey: inputRef, optional: true },
  ];

  const declarationRefkey = getJsonUnionTransformRefkey(props.type, props.target, serializerKind);
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
        return <JsonUnionTransform {...props} itemRef={inputRef} serializerKind={serializerKind} />
      </ts.FunctionDeclaration>
    </>
  );
}
