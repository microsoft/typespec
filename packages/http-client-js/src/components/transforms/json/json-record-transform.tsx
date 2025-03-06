import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonRecordTransformProps {
  itemRef: ay.Refkey | ay.Children;
  type: Model;
  target: "transport" | "application";
}

export function JsonRecordTransform(props: JsonRecordTransformProps) {
  if (!$.record.is(props.type)) {
    return null;
  }

  const elementType = $.record.getElementType(props.type);

  // TODO: Do we need to cast?
  return ay.code`
    if(!${props.itemRef}) {
      return ${props.itemRef} as any;
    }
      
    const _transformedRecord: any = {};

    for (const [key, value] of Object.entries(${props.itemRef} ?? {})) {
      const transformedItem = ${<JsonTransform type={elementType} target={props.target} itemRef="value as any" />};
      _transformedRecord[key] = transformedItem;
    }

    return _transformedRecord;
  `;
}

export function getJsonRecordTransformRefkey(
  type: Model,
  target: "transport" | "application",
): ay.Refkey {
  return ay.refkey(type, "json_record_transform", target);
}

export interface JsonRecordTransformDeclarationProps {
  type: Model;
  target: "transport" | "application";
}

export function JsonRecordTransformDeclaration(props: JsonRecordTransformDeclarationProps) {
  if (!$.record.is(props.type)) {
    return null;
  }

  const elementType = $.record.getElementType(props.type);
  const elementName =
    "name" in elementType && typeof elementType.name === "string" ? elementType.name : "element";

  const namePolicy = ts.useTSNamePolicy();
  const transformName = namePolicy.getName(
    `json_Record_${elementName}_to_${props.target}_transform`,
    "function",
  );

  const itemType = ay.code`Record<string, any>`;
  const returnType = props.target === "transport" ? "any" : itemType;
  const inputType = props.target === "transport" ? <>{itemType} | null</> : "any";
  const inputRef = ay.refkey();

  const parameters: Record<string, ts.ParameterDescriptor> = {
    items_: { type: inputType, refkey: inputRef, optional: true },
  };

  const declarationRefkey = getJsonRecordTransformRefkey(props.type, props.target);
  return <ts.FunctionDeclaration
      name={transformName}
      export
      returnType={returnType}
      parameters={parameters}
      refkey={declarationRefkey}
    >
      <JsonRecordTransform {...props} itemRef={inputRef} />
    </ts.FunctionDeclaration>;
}
