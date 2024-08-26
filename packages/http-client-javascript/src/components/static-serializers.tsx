import { code, refkey } from "@alloy-js/core"
import * as ts from "@alloy-js/typescript"

export const RecordSerializerRefkey = refkey();
export function RecordSerializer() {
  const recordType = `Record<string, any>`;
  const convertFnType = `(item: any) => any`;
  return (
    <ts.FunctionDeclaration export name="RecordSerializer" returnType={recordType} refkey={RecordSerializerRefkey}>
      <ts.FunctionDeclaration.Parameters>item: {recordType}, convertFn: {convertFnType}</ts.FunctionDeclaration.Parameters>
      {code`
        const output: Record<string, any> = {};

        for (const key in input) {
          if (Object.prototype.hasOwnProperty.call(input, key)) {
            const item = input[key];
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
