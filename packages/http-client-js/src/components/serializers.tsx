/*
  This file defines serializers for various data types used in the client.
  It leverages TypeSpec and AlloyJS to serialize and deserialize dates,
  as well as to provide JSON transformations for models and unions.
  It also handles setting up encoding providers based on the data type, 
  particularly to bypass byte conversion for file types.
*/

import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import {
  DateDeserializer,
  DateRfc3339Serializer,
  DateRfc7231Deserializer,
  DateRfc7231Serializer,
  DateUnixTimestampDeserializer,
  DateUnixTimestampSerializer,
} from "@typespec/emitter-framework/typescript";
import { useClientLibrary } from "@typespec/http-client";
import { flattenClients } from "../utils/client-discovery.js";
import { EncodingProvider } from "./encoding-provider.jsx";
import { DecodeBase64, EncodeUint8Array } from "./static-helpers/bytes-encoding.jsx";
import { JsonTransformDeclaration } from "./transforms/json/json-transform.jsx";
import { TransformDeclaration } from "./transforms/operation-transform-declaration.jsx";

/**
 * Interface for specifying the file path for the generated serializers
 */
export interface ModelSerializersProps {
  path?: string;
}

/**
 * ModelSerializers is a component that generates a TypeScript source file containing
 * serialization and deserialization utilities. It processes data types and operations obtained
 * from the client library and sets up JSON transforms for both transport and application layers.
 *
 * @param props - Component properties including an optional path for the output file.
 * @returns A component that contains the serializers functions.
 */
export function ModelSerializers(props: ModelSerializersProps) {
  const clientLibrary = useClientLibrary();
  const dataTypes = clientLibrary.dataTypes;
  // Flatten clients to get a list of operations from nested client structures
  const flatClients = clientLibrary.topLevel.flatMap((c) => flattenClients(c));
  const operations = flatClients.flatMap((c) => c.operations);

  // Generates a TypeScript source file with the necessary serializers and transforms.
  // Renders various decoding and encoding components for bytes and dates,
  // ensuring proper registration of deserializers and serializers used in the client library.
  return (
    <ts.SourceFile path={props.path ?? "serializers.ts"}>
      <DecodeBase64 />
      <EncodeUint8Array />
      <DateDeserializer />
      <DateRfc7231Deserializer />
      <DateRfc3339Serializer />
      <DateRfc7231Serializer />
      <DateUnixTimestampSerializer />
      <DateUnixTimestampDeserializer />

      {operations.map((o) => {
        // Generate operation transforms for each client operation.
        return <TransformDeclaration operation={o} />;
      })}
      {dataTypes
        .filter((m) => m.kind === "Model" || m.kind === "Union")
        .map((type) => {
          /**
           * Process each data type that is either a Model or a Union.
           * For each, determine if the type represents a file and set the corresponding default encoding.
           * Then render JSON transforms for both transport and application targets within an EncodingProvider.
           */
          let bytesDefaultEncoding: "base64" | "none" = "base64";
          if (isOrExtendsFile(type)) {
            // If the model represents a file or extends a file, avoid any byte encoding conversion.
            bytesDefaultEncoding = "none";
          }

          return (
            <EncodingProvider defaults={{ bytes: bytesDefaultEncoding }}>
              <JsonTransformDeclaration type={type} target="transport" />
              <JsonTransformDeclaration type={type} target="application" />
            </EncodingProvider>
          );
        })}
    </ts.SourceFile>
  );
}

/**
 * Helper function that determines if a given Type represents a file or inherits from one.
 *
 * @param type - The type to check
 * @returns true if the type is a file or extends from a file, false otherwise
 */
function isOrExtendsFile(type: Type): boolean {
  // Check if the type is a model; if not, it cannot be a file type.
  if (!$.model.is(type)) {
    return false;
  }

  // If the type directly represents an HTTP file, return true.
  if ($.model.isHttpFile(type)) {
    return true;
  }

  // Recursively check the base model to see if it inherits file characteristics
  return type.baseModel ? isOrExtendsFile(type.baseModel) : false;
}
