import { code } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { efRefkey } from "../utils/refkey.js";

/** Reference identity of the helper emitted by {@link DateRfc3339Serializer}; render that component to declare it. */
export const DateRfc3339SerializerRefkey = efRefkey();
/**
 * Declares an exported runtime helper converting a Date with `toISOString()`.
 * Generated code passes null and undefined through rather than creating a string.
 */
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

/** Reference identity of the helper emitted by {@link DateRfc7231Serializer}; render that component to declare it. */
export const DateRfc7231SerializerRefkey = efRefkey();
/** Declares an exported Date-to-HTTP-date helper using `toUTCString()`, passing null and undefined through. */
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

/** Reference identity of the helper emitted by {@link DateDeserializer}; used for application-target date transformations. */
export const DateDeserializerRefkey = efRefkey();
/**
 * Declares an exported string-to-Date helper using JavaScript's Date constructor.
 * Falsy inputs, including the empty string, pass through; date strings are not validated separately.
 */
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

/** Reference identity of the helper emitted by {@link DateUnixTimestampDeserializer}; does not itself emit a declaration. */
export const DateUnixTimestampDeserializerRefkey = efRefkey();
/**
 * Declares an exported seconds-to-Date helper, multiplying the input by 1000.
 * Generated code passes falsy inputs through, including zero rather than converting it to the epoch.
 */
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

/** Reference identity of the helper emitted by {@link DateRfc7231Deserializer}; does not itself emit a declaration. */
export const DateRfc7231DeserializerRefkey = efRefkey();
/**
 * Declares an exported HTTP-date-to-Date helper using JavaScript's Date constructor.
 * It does not enforce RFC 7231 syntax; falsy inputs pass through unchanged.
 */
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

/** Reference identity of the helper emitted by {@link DateUnixTimestampSerializer}; does not itself emit a declaration. */
export const DateUnixTimestampSerializerRefkey = efRefkey();
/** Declares an exported Date-to-seconds helper using floor(milliseconds / 1000), passing null and undefined through. */
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

/** Reference identity of the helper emitted by {@link RecordSerializer}, used by record transformations in either direction. */
export const RecordSerializerRefkey = efRefkey();
/**
 * Declares an exported helper copying a record's own enumerable string keys into a new object.
 * An optional callback converts each value; without it values are copied unchanged.
 * Falsy record inputs pass through.
 */
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

/** Reference identity of the helper emitted by {@link ArraySerializer}, used by array transformations in either direction. */
export const ArraySerializerRefkey = efRefkey();
/**
 * Declares an exported helper creating a new array in iteration order.
 * An optional callback converts each item; without it item values are copied unchanged.
 * Falsy array inputs pass through.
 */
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
