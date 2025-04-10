/**
 * This file defines transformer functions for various scalar types used in serialization and deserialization.
 * Each scalar type is associated with a pair of functions that handle transforming data to a transport representation and vice versa.
 * The code uses a mapping (scalarTransformerMap) that associates scalar type keys with their corresponding transformer function pairs.
 */

import { Children, code, Refkey } from "@alloy-js/core";
import { BytesKnownEncoding, EncodeData, NoTarget, Scalar } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import * as ef from "@typespec/emitter-framework/typescript";
import { useDefaultEncoding } from "../../context/encoding/encoding-context.jsx";
import { reportDiagnostic } from "../../lib.js";
import {
  getDecodeUint8ArrayRef,
  getEncodeUint8ArrayRef,
} from "../static-helpers/bytes-encoding.jsx";

/**
 * Define the transformer function type.
 * TransformerFn transforms a scalar value during either serialization or deserialization.
 * @param itemRef - A reference key or child element representing the value to be transformed.
 * @param encoding - Optional encoding data for guiding the transformation.
 */

export type TransformerFn = (itemRef: Refkey | Children, encoding?: EncodeData) => Children;

/**
 * Define a pair that holds functions for both directions: transforming to transport format and to application format.
 */
export interface TransformerPair {
  toTransport: TransformerFn;
  toApplication: TransformerFn;
}

/**
 * Returns the transformer pair for the given scalar type.
 * This function determines which transformer functions should be applied based on the scalar type.
 *
 * @param type - The scalar type to look up.
 * @returns The transformer pair from scalarTransformerMap for the given type.
 */
export function getScalarTransformer(type: Scalar): TransformerPair {
  return scalarTransformerMap[getScalarTransformKey(type)];
}

/*
 * Helper function to define the scalar transformer map with an inferred type.
 * This function simply returns the given mapping of transformer pairs.
 */
function defineScalarTransformerMap<T extends Record<string, TransformerPair>>(map: T): T {
  return map;
}

/**
 * A paired transformer map for scalar types.
 *
 * Each scalar type is associated with a pair of functions:
 * - toTransport: Transforms the scalar value for transport (serialization).
 * - toApplication: Transforms the scalar value for application (deserialization).
 *
 * Most numeric types use a passthrough transformation (no operation), while bytes and datetime types apply encoding-specific transformations.
 */
const scalarTransformerMap = defineScalarTransformerMap({
  // Boolean type: No transformation is required.
  boolean: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },

  // Bytes type: Applies transformation based on the specified encoding (base64 or base64url).
  bytes: {
    toTransport: (itemRef, encoding) => {
      // Determine the encoding for 'bytes'. Use provided encoding or fall back to default encoding.
      const bytesEncoding: BytesKnownEncoding | undefined =
        (encoding?.encoding as BytesKnownEncoding) ??
        (useDefaultEncoding("bytes") as BytesKnownEncoding);
      // Handle supported encodings; if unknown, report diagnostic and pass the value through unchanged.
      switch (bytesEncoding) {
        case "base64":
        case "base64url":
          const bytesEncodeRef = getEncodeUint8ArrayRef();
          return code`${bytesEncodeRef}(${itemRef}, "${bytesEncoding}")!`;
        default:
          reportDiagnostic($.program, {
            code: "unknown-encoding",
            target: encoding?.type ?? NoTarget,
          });
          return passthroughTransformer(itemRef);
      }
    },
    toApplication: (itemRef, encoding) => {
      // Determine the decoding strategy for 'bytes'.
      const bytesEncoding: BytesKnownEncoding | undefined =
        (encoding?.encoding as BytesKnownEncoding) ??
        (useDefaultEncoding("bytes") as BytesKnownEncoding);

      // Process the byte decoding, similar to the encoding branch.
      switch (bytesEncoding) {
        case "base64":
        case "base64url":
          const bytesDecodeRef = getDecodeUint8ArrayRef();
          return code`${bytesDecodeRef}(${itemRef})!`;
        default:
          reportDiagnostic($.program, {
            code: "unknown-encoding",
            target: encoding?.type ?? NoTarget,
          });
          return passthroughTransformer(itemRef);
      }
    },
  },

  // Numeric types that do not require transformation: just pass the value through.
  decimal: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  decimal128: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  float: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  float32: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  float64: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  int16: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  int32: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  int64: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  int8: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  integer: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  numeric: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  safeint: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  uint16: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  uint32: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  uint64: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  uint8: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },

  // Duration type: No transformation; value is passed through unchanged.
  duration: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },

  // Date/Time scalars: Using serializers/deserializers based on the encoding for proper conversion.
  offsetDateTime: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  plainDate: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  plainTime: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  utcDateTime: {
    toTransport: (itemRef, encoding) => {
      // For utcDateTime, decide on the serialization function based on the specified encoding.
      const dateEncoding = encoding?.encoding ?? useDefaultEncoding("datetime");
      // Default serializer function is DateRfc3339SerializerRefkey.
      let encodingFnRef: Refkey = ef.DateRfc3339SerializerRefkey;
      // Adjust serializer function reference based on encoding type.
      switch (dateEncoding) {
        case "unixTimestamp":
          encodingFnRef = ef.DateUnixTimestampSerializerRefkey;
          break;
        case "rfc7231":
          encodingFnRef = ef.DateRfc7231SerializerRefkey;
          break;
        case "rfc3339":
          // Already defaulted above.
          break;
        default:
          // Report an unknown encoding and fallback.
          reportDiagnostic($.program, {
            code: "unknown-encoding",
            target: encoding?.type ?? NoTarget,
          });
      }
      return code`${encodingFnRef}(${itemRef})`;
    },
    toApplication: (itemRef, encoding) => {
      // For deserialization of utcDateTime values, determine the proper deserialization function.
      const dateEncoding = encoding?.encoding ?? useDefaultEncoding("datetime");
      let decodingFnRef: Refkey = ef.DateDeserializerRefkey;
      switch (dateEncoding) {
        case "unixTimestamp":
          decodingFnRef = ef.DateUnixTimestampDeserializerRefkey;
          break;
        case "rfc7231":
          decodingFnRef = ef.DateRfc7231DeserializerRefkey;
          break;
        case "rfc3339":
          // Default already applied.
          break;
        default:
          reportDiagnostic($.program, {
            code: "unknown-encoding",
            target: encoding?.type ?? NoTarget,
          });
      }
      return code`${decodingFnRef}(${itemRef})!`;
    },
  },

  // unixTimestamp32: Uses specific functions for serialization and deserialization of unix timestamp values.
  unixTimestamp32: {
    toTransport: (itemRef) => {
      return code`${ef.DateUnixTimestampSerializerRefkey}(${itemRef})`;
    },
    toApplication: (itemRef) => {
      return code`${ef.DateUnixTimestampDeserializerRefkey}(${itemRef})`;
    },
  },

  // URL and string types: No transformation required, values are passed directly.
  url: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
  string: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },
});

/**
 * Type definition for a function that tests if a scalar type matches
 * a particular condition to determine its corresponding key in the transformer map.
 */
type ScalarTest = (type: Scalar) => boolean;

/*
 * Array of scalar tests that map scalar types to keys in the transformer map.
 * Each object contains a 'key' and a 'test' function that checks if a given scalar type conforms to the expected specification.
 */
const scalarTests: { key: keyof typeof scalarTransformerMap; test: ScalarTest }[] = [
  { key: "boolean", test: (t) => $.scalar.isBoolean(t) || $.scalar.extendsBoolean(t) },
  { key: "bytes", test: (t) => $.scalar.isBytes(t) || $.scalar.extendsBytes(t) },
  { key: "decimal", test: (t) => $.scalar.isDecimal(t) || $.scalar.extendsDecimal(t) },
  { key: "decimal128", test: (t) => $.scalar.isDecimal128(t) || $.scalar.extendsDecimal128(t) },
  { key: "duration", test: (t) => $.scalar.isDuration(t) || $.scalar.extendsDuration(t) },
  { key: "float", test: (t) => $.scalar.isFloat(t) || $.scalar.extendsFloat(t) },
  { key: "float32", test: (t) => $.scalar.isFloat32(t) || $.scalar.extendsFloat32(t) },
  { key: "float64", test: (t) => $.scalar.isFloat64(t) || $.scalar.extendsFloat64(t) },
  { key: "int16", test: (t) => $.scalar.isInt16(t) || $.scalar.extendsInt16(t) },
  { key: "int32", test: (t) => $.scalar.isInt32(t) || $.scalar.extendsInt32(t) },
  { key: "int64", test: (t) => $.scalar.isInt64(t) || $.scalar.extendsInt64(t) },
  { key: "int8", test: (t) => $.scalar.isInt8(t) || $.scalar.extendsInt8(t) },
  { key: "integer", test: (t) => $.scalar.isInteger(t) || $.scalar.extendsInteger(t) },
  { key: "numeric", test: (t) => $.scalar.isNumeric(t) || $.scalar.extendsNumeric(t) },
  {
    key: "offsetDateTime",
    test: (t) => $.scalar.isOffsetDateTime(t) || $.scalar.extendsOffsetDateTime(t),
  },
  { key: "plainDate", test: (t) => $.scalar.isPlainDate(t) || $.scalar.extendsPlainDate(t) },
  { key: "plainTime", test: (t) => $.scalar.isPlainTime(t) || $.scalar.extendsPlainTime(t) },
  { key: "safeint", test: (t) => $.scalar.isSafeint(t) || $.scalar.extendsSafeint(t) },
  { key: "string", test: (t) => $.scalar.isString(t) || $.scalar.extendsString(t) },
  { key: "uint16", test: (t) => $.scalar.isUint16(t) || $.scalar.extendsUint16(t) },
  { key: "uint32", test: (t) => $.scalar.isUint32(t) || $.scalar.extendsUint32(t) },
  { key: "uint64", test: (t) => $.scalar.isUint64(t) || $.scalar.extendsUint64(t) },
  { key: "uint8", test: (t) => $.scalar.isUint8(t) || $.scalar.extendsUint8(t) },
  { key: "url", test: (t) => $.scalar.isUrl(t) || $.scalar.extendsUrl(t) },
  { key: "utcDateTime", test: (t) => $.scalar.isUtcDateTime(t) || $.scalar.extendsUtcDateTime(t) },
];

/**
 * Determines the key to use in the scalarTransformerMap for the given scalar type.
 *
 * Iterates through the scalarTests in order until one condition is met,
 * and returns the corresponding key. Throws an error if no matching type is found.
 *
 * @param type - The scalar type to check.
 * @returns The corresponding key from the scalarTransformerMap.
 * @throws Error if the scalar type is unknown.
 */
function getScalarTransformKey(type: Scalar): keyof typeof scalarTransformerMap {
  for (const { key, test } of scalarTests) {
    if (test(type)) {
      return key;
    }
  }
  throw new Error(`Unknown scalar type: ${type}`);
}

/**
 * A passthrough transformer function that returns the input value unchanged.
 *
 * Used as a no-operation transformer for types that do not require serialization/deserialization modifications.
 *
 * @param itemRef - The value reference to be returned as is.
 * @returns The same value reference provided.
 */
function passthroughTransformer(itemRef: Refkey | Children) {
  return itemRef;
}
