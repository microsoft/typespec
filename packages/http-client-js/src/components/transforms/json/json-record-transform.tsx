import * as ts from "@alloy-js/typescript";

import { type Children, type Refkey, code, refkey } from "@alloy-js/core";
import type { Model } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import {
  getRecordTransformRefkey,
  getSerializerTransformFunctionPrefix,
  type SerializerTransformKind,
} from "../../../utils/serializer-transform.js";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonRecordTransformProps {
  itemRef: Refkey | Children;
  type: Model;
  target: "transport" | "application";
  serializerKind?: SerializerTransformKind;
}

export function JsonRecordTransform(props: JsonRecordTransformProps) {
  const { $ } = useTsp();
  if (!$.record.is(props.type)) {
    return null;
  }

  const elementType = $.record.getElementType(props.type);
  const serializationMediaType =
    props.serializerKind === "form_urlencoded" ? "application/x-www-form-urlencoded" : undefined;

  // TODO: Do we need to cast?
  return code`
    if(!${props.itemRef}) {
      return ${props.itemRef} as any;
    }
      
    const _transformedRecord: any = {};

    for (const [key, value] of Object.entries(${props.itemRef} ?? {})) {
      const transformedItem = ${(
        <JsonTransform
          type={elementType}
          target={props.target}
          itemRef="value as any"
          serializationMediaType={serializationMediaType}
        />
      )};
      _transformedRecord[key] = transformedItem;
    }

    return _transformedRecord;
  `;
}

export function getJsonRecordTransformRefkey(
  type: Model,
  target: "transport" | "application",
  kind: SerializerTransformKind = "json",
): Refkey {
  return getRecordTransformRefkey(type, target, kind);
}

export interface JsonRecordTransformDeclarationProps {
  type: Model;
  target: "transport" | "application";
  serializerKind?: SerializerTransformKind;
}

export function JsonRecordTransformDeclaration(props: JsonRecordTransformDeclarationProps) {
  const { $ } = useTsp();
  if (!$.record.is(props.type)) {
    return null;
  }

  const serializerKind = props.serializerKind ?? "json";
  const elementType = $.record.getElementType(props.type);
  const elementName =
    "name" in elementType && typeof elementType.name === "string" ? elementType.name : "element";

  const namePolicy = ts.useTSNamePolicy();
  const transformName = namePolicy.getName(
    `${getSerializerTransformFunctionPrefix(serializerKind)}_Record_${elementName}_to_${props.target}_transform`,
    "function",
  );

  const itemType = code`Record<string, any>`;
  const returnType = props.target === "transport" ? "any" : itemType;
  const inputType = props.target === "transport" ? <>{itemType} | null</> : "any";
  const inputRef = refkey();

  const parameters: ts.ParameterDescriptor[] = [
    { name: "items_", type: inputType, refkey: inputRef, optional: true },
  ];

  const declarationRefkey = getJsonRecordTransformRefkey(props.type, props.target, serializerKind);
  return (
    <ts.FunctionDeclaration
      name={transformName}
      export
      returnType={returnType}
      parameters={parameters}
      refkey={declarationRefkey}
    >
      <JsonRecordTransform {...props} itemRef={inputRef} serializerKind={serializerKind} />
    </ts.FunctionDeclaration>
  );
}
