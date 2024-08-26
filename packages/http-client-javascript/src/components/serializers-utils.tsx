import {Child} from "@alloy-js/core"
import { EncodeData, Model, Type } from "@typespec/compiler";
import * as ts from "@alloy-js/typescript"
import {$} from "@typespec/compiler/typekit"
import { ArraySerializerRefkey, RecordSerializerRefkey } from "./static-serializers.jsx";

export type SerializerExpression = {serializer: Child, params?: Child} | undefined;
export type SerializerBuilder = (type: Type, itemPath: string, options?: BuildSerializerOptions) => SerializerExpression
export interface BuildSerializerOptions {
  wrapperEncoding?: EncodeData;
}

export function buildArraySerializer(type: Model, buildSerializer: SerializerBuilder,  itemPath: string, options?: BuildSerializerOptions): SerializerExpression {
  const elementType = $.array.getElementType(type);
  const elementSerializer = buildSerializer(elementType, itemPath, options);
  return {
    serializer: (<>
    <ts.Reference refkey={ArraySerializerRefkey} />
  </>),
  params: <>{itemPath}, {elementSerializer?.serializer}</>}
}

export function buildRecordSerializer(type: Model, buildSerializer: SerializerBuilder, itemPath: string, options?: BuildSerializerOptions): SerializerExpression {
  const elementType = $.record.getElementType(type);
  const elementSerializer = buildSerializer(elementType, itemPath, options);
  return {
    serializer: (<>
    <ts.Reference refkey={RecordSerializerRefkey} />
  </>),
  params: <>{itemPath}, {elementSerializer?.serializer}</>}
}


export function Serializer(type: Type, buildSerializer: SerializerBuilder, itemPath: string, options?: BuildSerializerOptions): Child {
  const deserializerExp = buildSerializer(type, itemPath, options);
  if(!deserializerExp) {
    return itemPath;
  }

  if(!deserializerExp.params) {
    return deserializerExp.serializer
  }
  
  return (
    <>
      {deserializerExp.serializer}({deserializerExp.params})
    </>
  );
}
