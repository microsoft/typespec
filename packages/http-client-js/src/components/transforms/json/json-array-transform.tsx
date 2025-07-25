import * as ts from "@alloy-js/typescript";
import * as ef from "@typespec/emitter-framework/typescript";

import { type Children, type Refkey, code, refkey } from "@alloy-js/core";
import type { Model } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonArrayTransformProps {
  itemRef: Refkey | Children;
  type: Model;
  target: "transport" | "application";
}

export function JsonArrayTransform(props: JsonArrayTransformProps) {
  const { $ } = useTsp();
  if (!$.array.is(props.type)) {
    return null;
  }

  const elementType = $.array.getElementType(props.type);

  return code`
    if(!${props.itemRef}) {
      return ${props.itemRef} as any;
    }
    const _transformedArray = [];

    for (const item of ${props.itemRef} ?? []) {
      const transformedItem = ${(<JsonTransform type={elementType} target={props.target} itemRef="item as any" />)};
      _transformedArray.push(transformedItem);
    }

    return _transformedArray as any;
  `;
}

export function getJsonArrayTransformRefkey(
  type: Model,
  target: "transport" | "application",
): Refkey {
  return refkey(type, "json_array_transform", target);
}

export interface JsonArrayTransformDeclarationProps {
  type: Model;
  target: "transport" | "application";
}

export function JsonArrayTransformDeclaration(props: JsonArrayTransformDeclarationProps) {
  const { $ } = useTsp();
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

  const itemType = code`Array<${(<ef.TypeExpression type={elementType} />)}>`;
  const returnType = props.target === "transport" ? "any" : itemType;
  const inputType = props.target === "transport" ? <>{itemType} | null</> : "any";
  const inputRef = refkey();

  const parameters: ts.ParameterDescriptor[] = [
    { name: "items_", type: inputType, refkey: inputRef, optional: true },
  ];

  const declarationRefkey = getJsonArrayTransformRefkey(props.type, props.target);
  return (
    <ts.FunctionDeclaration
      name={transformName}
      export
      returnType={returnType}
      parameters={parameters}
      refkey={declarationRefkey}
    >
      <JsonArrayTransform {...props} itemRef={inputRef} />
    </ts.FunctionDeclaration>
  );
}
