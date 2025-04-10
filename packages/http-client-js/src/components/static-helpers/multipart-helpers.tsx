/**
 * This file provides helper functions and type declarations for handling multipart file descriptors.
 * It includes interfaces, type aliases, and a utility function for creating file part descriptors,
 * facilitating file uploads and multipart handling.
 */

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

/**
 * Props interface for MultipartHelpers component (currently empty as no props are needed).
 */
export interface MultipartHelpersProps {}

/**
 * Returns a reference key for the 'FileContents' type.
 * This reference key is used to uniquely identify the type in the static helpers.
 */
export function getFileContentsTypeReference() {
  return ay.refkey("FileContents", "type", "static-helpers");
}

/**
 * Returns a reference key for the 'createFilePartDescriptor' function.
 * This is used to uniquely identify the function in static helpers.
 */
export function getCreateFilePartDescriptorReference() {
  return ay.refkey("createFilePartDescriptor", "function", "static-helpers");
}

/**
 * Returns a reference key for the 'File' type.
 * This reference helps locate and identify the 'File' interface in the static helpers.
 */
export function getFileTypeReference() {
  return ay.refkey("File", "type", "static-helpers");
}

/**
 * Component that generates a source file containing multipart helper declarations.
 * It defines the File interface, FileContents type, and createFilePartDescriptor function.
 *
 * @param props - Properties passed to the component (currently unused).
 * @returns A SourceFile component containing type and function declarations.
 */
export function MultipartHelpers(props: MultipartHelpersProps) {
  /**
   * Composes the file with the following:
   * 1.Define the 'File' interface used for file operations in multipart handling.
   *   It specifies that a File contains its contents, and optionally contentType and filename.
   *
   * 2. Declare a type alias 'FileContents' which can be one of several types representing file data.
   *    This union type supports string, streams, Uint8Array, and Blob to cover multiple file representations.
   *
   * 3. Function to create a file part descriptor.
   *    It constructs an object used in multipart requests to encapsulate file data.
   */
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
        {ay.mapJoin(
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
    </ts.SourceFile>
  );
}

/**
 * Creates parameter descriptors for the createFilePartDescriptor function.
 * Describes the expected parameters with their names, types, and optionality.
 *
 * @returns An array of parameter descriptors.
 */
function getCreateFilePartParameters(): ts.ParameterDescriptor[] {
  return [
    // The name under which the file part is identified.
    { name: "partName", type: "string" },
    // The file or file descriptor; type is any to allow for flexibility.
    { name: "fileInput", type: "any" },
    // An optional default content type to be used if fileInput doesn't provide one.
    {
      name: "defaultContentType",
      optional: true,
      refkey: ay.refkey(),
      type: "string",
    },
  ];
}
