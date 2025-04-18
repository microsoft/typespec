/**
 * This file defines a component that generates TypeScript type declarations
 * for model types using the client library. It iterates over each data type provided
 * by the client library and conditionally generates corresponding TypeScript code.
 * The generated code handles both HTTP file models and regular type declarations.
 */

import { For, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import * as ef from "@typespec/emitter-framework/typescript";
import { useClientLibrary } from "@typespec/http-client";
import { getFileTypeReference } from "./static-helpers/multipart-helpers.jsx";

/**
 * This interface defines the expected props for the Models component.
 * The 'path' property is optional and represents the file path for the generated TypeScript file.
 */
export interface ModelsProps {
  path?: string;
}

/**
 * Models component
 *
 * This component generates a TypeScript source file containing type declarations
 * based on the data types obtained from the client library. It composes the source
 * file and conditionally renders type declarations for HTTPFile models and other
 * model types.
 *
 * @param props - Props passed to the component; includes an optional file 'path'.
 * @returns A component representing a TypeScript source file with the generated type declarations.
 */
export function Models(props: ModelsProps) {
  // Client library hook provides access to data types
  const clientLibrary = useClientLibrary();
  // Extract the array of data types from the client library
  // These have been collected when walking the client hierarchy
  const dataTypes = clientLibrary.dataTypes;

  return (
    // Create a TypeScript source file with the specified or default path "models.ts"
    // Iterate over each data type from the client library.
    // For each type, determine the appropriate TypeScript type declaration to generate.
    <ts.SourceFile path={props.path ?? "models.ts"}>
      <For each={dataTypes} joiner={"\n"} hardline>
        {(type) => {
          // If the data type is a model and represents an HTTP file,
          // generate a special 'File' type declaration using the file type reference.
          if ($.model.is(type) && $.model.isHttpFile(type)) {
            return (
              <ts.TypeDeclaration name="File" export kind="type" refkey={refkey(type)}>
                {getFileTypeReference()}
              </ts.TypeDeclaration>
            );
          }
          // If the type is an array or a record, skip rendering a declaration (return null)
          // we just need to declare the type wrapped in the array or record.
          // Otherwise, generate a standard type declaration using the emitter framework.
          return $.array.is(type) || $.record.is(type) ? null : (
            <ef.TypeDeclaration export type={type} />
          );
        }}
      </For>
    </ts.SourceFile>
  );
}
