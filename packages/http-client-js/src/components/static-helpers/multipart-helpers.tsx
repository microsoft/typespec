import { code, mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
export interface MultipartHelpersProps {}

export function getFileContentsTypeReference() {
  return refkey("FileContents", "type", "static-helpers");
}

export function getCreateFilePartDescriptorReference() {
  return refkey("createFilePartDescriptor", "function", "static-helpers");
}

export function getFileTypeReference() {
  return refkey("File", "type", "static-helpers");
}

export function MultipartHelpers(props: MultipartHelpersProps) {
  return (
    <ts.SourceFile path="multipart-helpers.ts">
      <ts.InterfaceDeclaration name="File" export refkey={getFileTypeReference()}>
        contents: {getFileContentsTypeReference()}; contentType?: string; filename?: string;
      </ts.InterfaceDeclaration>
      <ts.TypeDeclaration
        name="FileContents"
        export
        kind="type"
        refkey={getFileContentsTypeReference()}
      >
        {mapJoin(
          () => [
            "string",
            "NodeJS.ReadableStream",
            "ReadableStream<Uint8Array>",
            "Uint8Array",
            "Blob",
          ],
          (t) => t,
          { joiner: " | " },
        )}
      </ts.TypeDeclaration>
      <ts.FunctionDeclaration
        name="createFilePartDescriptor"
        parameters={getCreateFilePartParameters()}
        export
        returnType="any"
        refkey={getCreateFilePartDescriptorReference()}
      >
        {code`
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
    </ts.SourceFile>
  );
}

function getCreateFilePartParameters(): ts.ParameterDescriptor[] {
  return [
    { name: "partName", type: "string" },
    { name: "fileInput", type: "any" },
    {
      name: "defaultContentType",
      optional: true,
      refkey: refkey(),
      type: "string",
    },
  ];
}
