import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as ef from "@typespec/emitter-framework/typescript";

import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonArrayTransformProps {
  itemRef: ay.Refkey | ay.Children;
  type: Model;
  target: "transport" | "application";
}

export function JsonArrayTransform(props: JsonArrayTransformProps) {
  if (!$.array.is(props.type)) {
    return null;
  }

  const elementType = $.array.getElementType(props.type);

  return ay.code`
    if(!${props.itemRef}) {
      return ${props.itemRef} as any;
    }
    const _transformedArray = [];

    for (const item of ${props.itemRef} ?? []) {
      const transformedItem = ${<JsonTransform type={elementType} target={props.target} itemRef="item as any" />};
      _transformedArray.push(transformedItem);
    }

    return _transformedArray as any;
  `;
}

export function getJsonArrayTransformRefkey(
  type: Model,
  target: "transport" | "application",
): ay.Refkey {
  return ay.refkey(type, "json_array_transform", target);
}

export interface JsonArrayTransformDeclarationProps {
  type: Model;
  target: "transport" | "application";
}

export function JsonArrayTransformDeclaration(props: JsonArrayTransformDeclarationProps) {
  if (!$.array.is(props.type)) {
    return null;
  }

  const elementType = $.array.getElementType(props.type);
  const elementName =
    "name" in elementType && typeof elementType.name === "string" ? elementType.name : "element";

  const namePolicy = ts.useTSNamePolicy();
  const transformName = namePolicy.getName(
    `json_Array_${elementName}_to_${props.target}_transform`,
    "function",
  );

  const itemType = ay.code`Array<${<ef.TypeExpression type={elementType} />}>`;
  const returnType = props.target === "transport" ? "any" : itemType;
  const inputType = props.target === "transport" ? <>{itemType} | null</> : "any";
  const inputRef = ay.refkey();

  const parameters: Record<string, ts.ParameterDescriptor> = {
    items_: { type: inputType, refkey: inputRef, optional: true },
  };

  const declarationRefkey = getJsonArrayTransformRefkey(props.type, props.target);
  return <ts.FunctionDeclaration
      name={transformName}
      export
      returnType={returnType}
      parameters={parameters}
      refkey={declarationRefkey}
    >
      <JsonArrayTransform {...props} itemRef={inputRef} />
    </ts.FunctionDeclaration>;
}
