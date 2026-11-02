import { useTsp } from "#core/index.js";
import { createContext, namekey, useContext, type Children, type Namekey } from "@alloy-js/core";
import {
  getTypeName,
  type DurationKnownEncoding,
  type EncodeData,
  type Type,
} from "@typespec/compiler";
import { capitalize } from "@typespec/compiler/casing";
import { getNullableUnionInnerType } from "../utils/nullable-util.js";
import { TimeSpanIso8601JsonConverter, TimeSpanSecondsJsonConverter } from "./json-converter.jsx";

/** Reference identity and declaration tree for a converter selected by a resolver. */
interface JsonConverterInfo {
  /** Namekey used both to declare the converter and to reference it from attributes. */
  namekey: Namekey;
  /** Converter declaration to render once alongside the generated types. */
  converter: Children;
}

/**
 * Help to resolve JsonConverter for a given type with encoding:
 *   1. Avoid unnecessary duplicate JsonConverter declaration for the same type with same encoding.
 *   2. Provide resolved JsonConverters to be generated centralized properly as needed.
 * */
export interface useJsonConverterResolver {
  /**
   * Resolves and caches a converter by type name, encoding, and encoded type name.
   * Custom registrations take precedence over built-ins; unsupported combinations return
   * `undefined`. Built-in resolution requires a TypeSpec render context.
   */
  resolveJsonConverter: (type: Type, encodeData: EncodeData) => JsonConverterInfo | undefined;
  /** Returns a new array of converters actually resolved, in first-resolution order. */
  listResolvedJsonConverters: () => JsonConverterInfo[];
}

/** Provides the shared converter resolver used by descendant JSON-enabled property components. */
export const JsonConverterResolver = createContext<useJsonConverterResolver>();

/** Gets the nearest converter resolver, or `undefined` when no provider is installed. */
export function useJsonConverterResolver(): useJsonConverterResolver | undefined {
  return useContext(JsonConverterResolver);
}

/** Custom converter registrations to consider before the built-in duration converters. */
export interface JsonConverterResolverOptions {
  /** Custom JSON converters besides the built-in ones for known encode*/
  customConverters?: {
    /** Source type whose name participates in the converter lookup key. */
    type: Type;
    /** Encoding and encoded scalar type distinguishing this registration. */
    encodeData: EncodeData;
    /** Reference and declaration returned when this registration is selected. */
    info: JsonConverterInfo;
  }[];
}

/**
 * Creates a resolver with an initially empty set of used converters.
 * Built-ins cover duration encoded as ISO 8601 or supported numeric seconds.
 * Call `listResolvedJsonConverters` after rendering properties to obtain the declarations
 * that must be emitted; merely registering a custom converter does not mark it as used.
 */
export function createJsonConverterResolver(
  options?: JsonConverterResolverOptions,
): useJsonConverterResolver {
  const resolvedConverters = new Map<string, JsonConverterInfo>();
  const customConverters = new Map<string, JsonConverterInfo>();

  if (options?.customConverters) {
    for (const item of options.customConverters) {
      const key = getJsonConverterKey(item.type, item.encodeData);
      customConverters.set(key, item.info);
    }
  }

  return {
    resolveJsonConverter: (type: Type, encodeData: EncodeData) => {
      const key = getJsonConverterKey(type, encodeData);
      const found = resolvedConverters.get(key);
      if (found) {
        return found;
      } else {
        const resolved = customConverters.get(key) ?? resolveKnownJsonConverter(type, encodeData);
        if (resolved) {
          resolvedConverters.set(key, resolved);
          return resolved;
        }
      }
      return undefined;
    },
    listResolvedJsonConverters: () => Array.from(resolvedConverters.values()),
  };

  function getJsonConverterKey(type: Type, encodeData: EncodeData) {
    return `type:${getTypeName(type)}-encoding:${encodeData.encoding}-encodeType:${getTypeName(encodeData.type)}`;
  }

  function resolveKnownJsonConverter(
    type: Type,
    encodeData: EncodeData,
  ): JsonConverterInfo | undefined {
    const ENCODING_DURATION_SECONDS: DurationKnownEncoding = "seconds";
    const ENCODING_DURATION_ISO8601: DurationKnownEncoding = "ISO8601";
    const { $ } = useTsp();
    // Unwrap nullable because JsonConverter<T> would handle null by default for us.
    const unwrappedType = type.kind === "Union" ? (getNullableUnionInnerType(type) ?? type) : type;
    if (
      unwrappedType === $.builtin.duration &&
      encodeData.encoding === ENCODING_DURATION_SECONDS &&
      [
        $.builtin.int16,
        $.builtin.uint16,
        $.builtin.int32,
        $.builtin.uint32,
        $.builtin.int64,
        $.builtin.uint64,
        $.builtin.float32,
        $.builtin.float64,
      ].includes(encodeData.type)
    ) {
      const capitalizedTypeName = capitalize(encodeData.type.name);
      const key: Namekey = namekey(`TimeSpanSeconds${capitalizedTypeName}JsonConverter`);
      return {
        namekey: key,
        converter: <TimeSpanSecondsJsonConverter name={key} encodeType={encodeData.type} />,
      };
    } else if (
      unwrappedType === $.builtin.duration &&
      encodeData.encoding === ENCODING_DURATION_ISO8601
    ) {
      const key = namekey(`TimeSpanIso8601JsonConverter`);
      return {
        namekey: key,
        converter: <TimeSpanIso8601JsonConverter name={key} />,
      };
    } else {
      // TODO: support other known encodings
      return undefined;
    }
  }
}
