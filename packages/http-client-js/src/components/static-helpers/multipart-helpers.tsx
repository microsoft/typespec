import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
export interface MultipartHelpersProps {}

export function getFileContentsTypeReference() {
  return ay.refkey("FileContents", "type", "static-helpers");
}

export function getCreateFilePartDescriptorReference() {
  return ay.refkey("createFilePartDescriptor", "function", "static-helpers");
}

export function getFileTypeReference() {
  return ay.refkey("File", "type", "static-helpers");
}

export function MultipartHelpers(props: MultipartHelpersProps) {
  return <ts.SourceFile path="multipart-helpers.ts">
    <ts.InterfaceDeclaration name="File" export refkey={getFileTypeReference()}>
    contents: {getFileContentsTypeReference()};
    contentType?: string;
    filename?: string;
    </ts.InterfaceDeclaration>
    <ts.TypeDeclaration name="FileContents" export kind="type" refkey={getFileContentsTypeReference()}>
      {ay.mapJoin(["string", "NodeJS.ReadableStream", "ReadableStream<Uint8Array>", "Uint8Array", "Blob"], (t) => t, {joiner: " | "})}
    </ts.TypeDeclaration>
    <ts.FunctionDeclaration name="createFilePartDescriptor" parameters={getCreateFilePartParameters()} export returnType="any" refkey={getCreateFilePartDescriptorReference()}>
      {ay.code`
       if (fileInput.contents) {
          return {
            name: partName,
            body: fileInput.contents,
            contentType: fileInput.contentType ?? defaultContentType,
            filename: fileInput.filename,
          };
        } else {
          return {
            name: partName,
            body: fileInput,
            contentType: defaultContentType,
          };
        }
      `}
    </ts.FunctionDeclaration>
  </ts.SourceFile>;
}

function getCreateFilePartParameters() {
  return {
    partName: "string",
    fileInput: "any",
    defaultContentType: {
      optional: true,
      key: "defaultContentType",
      refkey: ay.refkey(),
      type: "string",
    },
  };
}
