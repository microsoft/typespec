import { code } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { efRefkey } from "../utils/refkey.js";

export const DateRfc3339SerializerRefkey = efRefkey();
export function DateRfc3339Serializer() {
  return (
    <ts.FunctionDeclaration
      export
      name="DateRfc3339Serializer"
      returnType="string"
      refkey={DateRfc3339SerializerRefkey}
    >
      <ts.FunctionDeclaration.Parameters>date?: Date | null</ts.FunctionDeclaration.Parameters>
      {code`
        if (!date) {
          return date as any
        }

        return date.toISOString();
      `}
    </ts.FunctionDeclaration>
  );
}

export const DateRfc7231SerializerRefkey = efRefkey();
export function DateRfc7231Serializer() {
  return (
    <ts.FunctionDeclaration
      export
      name="DateRfc7231Serializer"
      returnType="string"
      refkey={DateRfc7231SerializerRefkey}
    >
      <ts.FunctionDeclaration.Parameters>date?: Date | null</ts.FunctionDeclaration.Parameters>
      {code`
        if (!date) {
          return date as any;
        }

        return date.toUTCString();
      `}
    </ts.FunctionDeclaration>
  );
}

export const DateDeserializerRefkey = efRefkey();
export function DateDeserializer() {
  return (
    <ts.FunctionDeclaration
      export
      name="DateDeserializer"
      returnType="Date"
      refkey={DateDeserializerRefkey}
    >
      <ts.FunctionDeclaration.Parameters>date?: string | null</ts.FunctionDeclaration.Parameters>
      {code`
        if (!date) {
          return date as any;
        }

        return new Date(date);
      `}
    </ts.FunctionDeclaration>
  );
}

export const DateUnixTimestampDeserializerRefkey = efRefkey();
export function DateUnixTimestampDeserializer() {
  return (
    <ts.FunctionDeclaration
      export
      name="DateUnixTimestampDeserializer"
      returnType="Date"
      refkey={DateUnixTimestampDeserializerRefkey}
    >
      <ts.FunctionDeclaration.Parameters>date?: number | null</ts.FunctionDeclaration.Parameters>
      {code`
        if (!date) {
          return date as any;
        }

        return new Date(date * 1000);
      `}
    </ts.FunctionDeclaration>
  );
}

export const DateRfc7231DeserializerRefkey = efRefkey();
export function DateRfc7231Deserializer() {
  return (
    <ts.FunctionDeclaration
      export
      name="DateRfc7231Deserializer"
      returnType="Date"
      refkey={DateRfc7231DeserializerRefkey}
    >
      <ts.FunctionDeclaration.Parameters>date?: string | null</ts.FunctionDeclaration.Parameters>
      {code`
        if (!date) {
          return date as any;
        }

        return new Date(date);
      `}
    </ts.FunctionDeclaration>
  );
}

export const DateUnixTimestampSerializerRefkey = efRefkey();
export function DateUnixTimestampSerializer() {
  return (
    <ts.FunctionDeclaration
      export
      name="DateUnixTimestampSerializer"
      returnType="number"
      refkey={DateUnixTimestampSerializerRefkey}
    >
      <ts.FunctionDeclaration.Parameters>date?: Date | null</ts.FunctionDeclaration.Parameters>
      {code`
        if (!date) {
          return date as any;
        }

        return Math.floor(date.getTime() / 1000);
      `}
    </ts.FunctionDeclaration>
  );
}

export const RecordSerializerRefkey = efRefkey();
export function RecordSerializer() {
  const recordType = `Record<string, any>`;
  const convertFnType = `(item: any) => any`;
  return (
    <ts.FunctionDeclaration
      export
      name="RecordSerializer"
      returnType={recordType}
      refkey={RecordSerializerRefkey}
    >
      <ts.FunctionDeclaration.Parameters>
        record?: {recordType}, convertFn?: {convertFnType}
      </ts.FunctionDeclaration.Parameters>
      {code`
        if (!record) {
          return record as any;
        }
        const output: Record<string, any> = {};

        for (const key in record) {
          if (Object.prototype.hasOwnProperty.call(record, key)) {
            const item = record[key];
            output[key] = convertFn ? convertFn(item) : item;
          }
        }

        return output;
      `}
    </ts.FunctionDeclaration>
  );
}

export const ArraySerializerRefkey = efRefkey();
export function ArraySerializer() {
  const arrayType = `any[]`;
  const convertFnType = `(item: any) => any`;
  return (
    <ts.FunctionDeclaration
      export
      name="ArraySerializer"
      returnType={arrayType}
      refkey={ArraySerializerRefkey}
    >
      <ts.FunctionDeclaration.Parameters>
        items?: {arrayType}, convertFn?: {convertFnType}
      </ts.FunctionDeclaration.Parameters>
      {code`
        if (!items) {
          return items as any;
        }
          
        const output: any[] = [];

        for (const item of items) {
          if(convertFn) {
            output.push(convertFn(item));
          } else {
            output.push(item);
          }
        }

        return output;
      `}
    </ts.FunctionDeclaration>
  );
}
