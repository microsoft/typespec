import { useTsp } from "#core/index.js";
import { createContext, refkey, useContext, type Children, type Refkey } from "@alloy-js/core";
import {
  getTypeName,
  type DurationKnownEncoding,
  type EncodeData,
  type Type,
} from "@typespec/compiler";
import { getNullableUnionInnerType } from "../utils/nullable-util.js";
import { TimeSpanIso8601JsonConverter, TimeSpanSecondsJsonConverter } from "./json-converter.jsx";

interface JsonConverterInfo {
  refkey: Refkey;
  name: string;
  converter: Children;
}

/**
 * Help to resolve JsonConverter for a given type with encoding:
 *   1. Avoid unnecessary duplicate JsonConverter declaration for the same type with same encoding.
 *   2. Provide resolved JsonConverters to be generated centralized properly as needed.
 * */
export interface useJsonConverterResolver {
  resolveJsonConverter: (type: Type, encodeData: EncodeData) => JsonConverterInfo | undefined;
  listResolvedJsonConverters: () => JsonConverterInfo[];
}

export const JsonConverterResolver = createContext<useJsonConverterResolver>();

export function useJsonConverterResolver(): useJsonConverterResolver | undefined {
  return useContext(JsonConverterResolver);
}

export interface JsonConverterResolverOptions {
  /** Custom JSON converters besides the built-in ones for known encode*/
  customConverters?: { type: Type; encodeData: EncodeData; info: JsonConverterInfo }[];
}

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
    const key: Refkey = refkey();
    // Unwrap nullable because JsonConverter<T> would handle null by default for us.
    const unwrappedType = type.kind === "Union" ? (getNullableUnionInnerType(type) ?? type) : type;
    if (unwrappedType === $.builtin.duration && encodeData.encoding === ENCODING_DURATION_SECONDS) {
      const name = `TimeSpanSecondsJsonConverter`;
      return {
        name,
        refkey: key,
        converter: <TimeSpanSecondsJsonConverter refkey={key} name={name} />,
      };
    } else if (
      unwrappedType === $.builtin.duration &&
      encodeData.encoding === ENCODING_DURATION_ISO8601
    ) {
      const name = `TimeSpanIso8601JsonConverter`;
      return {
        name,
        refkey: key,
        converter: <TimeSpanIso8601JsonConverter refkey={key} name={name} />,
      };
    } else {
      // TODO: support other known encodings
      return undefined;
    }
  }
}
