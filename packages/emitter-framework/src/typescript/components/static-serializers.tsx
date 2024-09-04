import { code, refkey } from "@alloy-js/core"
import * as ts from "@alloy-js/typescript"

export const DateRfc3339SerializerRefkey = refkey();
export function DateRfc3339Serializer() {
  return (
    <ts.FunctionDeclaration export name="DateRfc3339Serializer" returnType="string" refkey={DateRfc3339SerializerRefkey}>
      <ts.FunctionDeclaration.Parameters>date: Date</ts.FunctionDeclaration.Parameters>
      {code`
        return date.toISOString();
      `}
    </ts.FunctionDeclaration>)
}

export const DateRfc7231SerializerRefkey = refkey();
export function DateRfc7231Serializer() {
  return (
    <ts.FunctionDeclaration export name="DateRfc7231Serializer" returnType="string" refkey={DateRfc7231SerializerRefkey}>
      <ts.FunctionDeclaration.Parameters>date: Date</ts.FunctionDeclaration.Parameters>
      {code`
        return date.toUTCString();
      `}
    </ts.FunctionDeclaration>)
}

export const DateDeserializerRefkey = refkey();
export function DateDeserializer() {
  return (
    <ts.FunctionDeclaration export name="DateDeserializer" returnType="Date" refkey={DateDeserializerRefkey}>
      <ts.FunctionDeclaration.Parameters>date: string</ts.FunctionDeclaration.Parameters>
      {code`
        return new Date(date);
      `}
    </ts.FunctionDeclaration>)
}

export const DateUnixTimestampDeserializerRefkey = refkey();
export function DateUnixTimestampDeserializer() {
  return (
    <ts.FunctionDeclaration export name="DateUnixTimestampDeserializer" returnType="Date" refkey={DateUnixTimestampDeserializerRefkey}>
      <ts.FunctionDeclaration.Parameters>date: number</ts.FunctionDeclaration.Parameters>
      {code`
        return new Date(date * 1000);
      `}
    </ts.FunctionDeclaration>)
}

export const DateRfc7231DeserializerRefkey = refkey();
export function DateRfc7231Deserializer() {
  return (
    <ts.FunctionDeclaration export name="DateRfc7231Deserializer" returnType="Date" refkey={DateRfc7231DeserializerRefkey}>
      <ts.FunctionDeclaration.Parameters>date: string</ts.FunctionDeclaration.Parameters>
      {code`
        return new Date(date);
      `}
    </ts.FunctionDeclaration>)
}

export const DateUnixTimestampSerializerRefkey = refkey();
export function DateUnixTimestampSerializer() {
  return (
    <ts.FunctionDeclaration export name="DateUnixTimestampSerializer" returnType="number" refkey={DateUnixTimestampSerializerRefkey}>
      <ts.FunctionDeclaration.Parameters>date: Date</ts.FunctionDeclaration.Parameters>
      {code`
        return date.getTime();
      `}
    </ts.FunctionDeclaration>)
}

export const RecordSerializerRefkey = refkey();
export function RecordSerializer() {
  const recordType = `Record<string, any>`;
  const convertFnType = `(item: any) => any`;
  return (
    <ts.FunctionDeclaration export name="RecordSerializer" returnType={recordType} refkey={RecordSerializerRefkey}>
      <ts.FunctionDeclaration.Parameters>record: {recordType}, convertFn: {convertFnType}</ts.FunctionDeclaration.Parameters>
      {code`
        const output: Record<string, any> = {};

        for (const key in record) {
          if (Object.prototype.hasOwnProperty.call(record, key)) {
            const item = record[key];
            output[key] = convertFn(item);
          }
        }

        return output;
      `}
    </ts.FunctionDeclaration>
  )
}

export const ArraySerializerRefkey = refkey();
export function ArraySerializer() {
  const arrayType = `any[]`;
  const convertFnType = `(item: any) => any`;
  return (
    <ts.FunctionDeclaration export name="ArraySerializer" returnType={arrayType} refkey={ArraySerializerRefkey}>
      <ts.FunctionDeclaration.Parameters>items: {arrayType}, convertFn?: {convertFnType}</ts.FunctionDeclaration.Parameters>
      {code`
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
  )
}
