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

// Define the transformer function type.
export type TransformerFn = (itemRef: Refkey | Children, encoding?: EncodeData) => Children;

// Define a pair that holds both directions.
export interface TransformerPair {
  toTransport: TransformerFn;
  toApplication: TransformerFn;
}

/**
 * Returns the transformer pair for the given scalar type.
 *
 * @param type - The scalar type to look up.
 * @returns The transformer pair from scalarTransformerMap for the given type.
 */
export function getScalarTransformer(type: Scalar): TransformerPair {
  return scalarTransformerMap[getScalarTransformKey(type)];
}

function defineScalarTransformerMap<T extends Record<string, TransformerPair>>(map: T): T {
  return map;
}

/**
 * A paired transformer map for scalar types.
 *
 * Each scalar type is associated with a pair of functions: one for transforming the value for transport
 * (serialization) and one for transforming the value for application (deserialization).
 */
const scalarTransformerMap = defineScalarTransformerMap({
  boolean: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },

  bytes: {
    toTransport: (itemRef, encoding) => {
      const bytesEncoding: BytesKnownEncoding | undefined =
        (encoding?.encoding as BytesKnownEncoding) ??
        (useDefaultEncoding("bytes") as BytesKnownEncoding);
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
      const bytesEncoding: BytesKnownEncoding | undefined =
        (encoding?.encoding as BytesKnownEncoding) ??
        (useDefaultEncoding("bytes") as BytesKnownEncoding);

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

  // For numerics that have no transformation, both directions simply passthrough.
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

  // Duration: We don't apply any transformation so just passthrough.
  duration: {
    toTransport: (itemRef) => passthroughTransformer(itemRef),
    toApplication: (itemRef) => passthroughTransformer(itemRef),
  },

  // Date/Time scalars: using a serializer on transport and a deserializer on application.
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
      const dateEncoding = encoding?.encoding ?? useDefaultEncoding("datetime");
      let encodingFnRef: Refkey = ef.DateRfc3339SerializerRefkey;
      switch (dateEncoding) {
        case "unixTimestamp":
          encodingFnRef = ef.DateUnixTimestampSerializerRefkey;
          break;
        case "rfc7231":
          encodingFnRef = ef.DateRfc7231SerializerRefkey;
          break;
        case "rfc3339":
          // already defaulted above.
          break;
        default:
          reportDiagnostic($.program, {
            code: "unknown-encoding",
            target: encoding?.type ?? NoTarget,
          });
      }
      return code`${encodingFnRef}(${itemRef})`;
    },
    toApplication: (itemRef, encoding) => {
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
          // default already
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

  unixTimestamp32: {
    toTransport: (itemRef) => {
      return code`${ef.DateUnixTimestampSerializerRefkey}(${itemRef})`;
    },
    toApplication: (itemRef) => {
      return code`${ef.DateUnixTimestampDeserializerRefkey}(${itemRef})`;
    },
  },

  // For URL and string, no transformation is needed.
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
 * Tests for determining the scalar transformation key.
 */
type ScalarTest = (type: Scalar) => boolean;

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

function passthroughTransformer(itemRef: Refkey | Children) {
  return itemRef;
}
