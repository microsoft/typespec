import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

export function getEncodeUint8ArrayRef(): ay.Refkey {
  return ay.refkey("encodeUint8Array");
}

export function EncodeUint8Array(): ay.Children {
  const valueRef = ay.refkey();
  const encodingRef = ay.refkey();
  const refkey = getEncodeUint8ArrayRef();
  return <ts.FunctionDeclaration export refkey={refkey} name="encodeUint8Array" parameters={{value: {type: "Uint8Array | undefined | null", refkey: valueRef,}, encoding: {type: "BufferEncoding", refkey: encodingRef}}} returnType="string | undefined">
   {ay.code`
      if (!${valueRef}) {
        return ${valueRef} as any;
      }
      return Buffer.from(${valueRef}).toString(${encodingRef});
   `} 
  </ts.FunctionDeclaration>;
}

export function getDecodeUint8ArrayRef(): ay.Refkey {
  return ay.refkey("decodeUint8Array");
}
export function DecodeBase64(): ay.Children {
  const refkey = getDecodeUint8ArrayRef();
  const valueRef = ay.refkey();
  return <ts.FunctionDeclaration export name="decodeBase64"  parameters={{value: {type: "string", refkey: valueRef}}} returnType="Uint8Array | undefined"  refkey={refkey}>
    {ay.code` 
      if(!${valueRef}) {
        return ${valueRef} as any;
      }
      // Normalize Base64URL to Base64
      const base64 = ${valueRef}.replace(/-/g, '+').replace(/_/g, '/')
          .padEnd(${valueRef}.length + (4 - (${valueRef}.length % 4)) % 4, '=');
      
      return new Uint8Array(Buffer.from(base64, 'base64'));
    `}

  </ts.FunctionDeclaration>;
}
