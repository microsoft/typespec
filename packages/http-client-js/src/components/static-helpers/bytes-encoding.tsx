import { code, Refkey, refkey } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import * as ts from "@alloy-js/typescript";

export function getEncodeUint8ArrayRef(): Refkey {
  return refkey("encodeUint8Array");
}

export function EncodeUint8Array(): Children {
  const valueRef = refkey();
  const encodingRef = refkey();
  const key = getEncodeUint8ArrayRef();
  return (
    <ts.FunctionDeclaration
      export
      refkey={key}
      name="encodeUint8Array"
      parameters={[
        { name: "value", type: "Uint8Array | undefined | null", refkey: valueRef },
        { name: "encoding", type: "BufferEncoding", refkey: encodingRef },
      ]}
      returnType="string | undefined"
    >
      {code`
      if (!${valueRef}) {
        return ${valueRef} as any;
      }
      return Buffer.from(${valueRef}).toString(${encodingRef});
   `}
    </ts.FunctionDeclaration>
  );
}

export function getDecodeUint8ArrayRef(): Refkey {
  return refkey("decodeUint8Array");
}
export function DecodeBase64(): Children {
  const key = getDecodeUint8ArrayRef();
  const valueRef = refkey();
  return (
    <ts.FunctionDeclaration
      export
      name="decodeBase64"
      parameters={[{ name: "value", type: "string", refkey: valueRef }]}
      returnType="Uint8Array | undefined"
      refkey={key}
    >
      {code` 
      if(!${valueRef}) {
        return ${valueRef} as any;
      }
      // Normalize Base64URL to Base64
      const base64 = ${valueRef}.replace(/-/g, '+').replace(/_/g, '/')
          .padEnd(${valueRef}.length + (4 - (${valueRef}.length % 4)) % 4, '=');
      
      return new Uint8Array(Buffer.from(base64, 'base64'));
    `}
    </ts.FunctionDeclaration>
  );
}
