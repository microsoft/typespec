import { MockBody, MockMultipartBody, Resolver, ResolverConfig } from "./types.js";

/**
 * Serialize the provided content as json to use in a MockResponse body.
 * @content Object to return as json.
 * @returns {MockBody} response body with application/json content type.
 */
export function json(content: unknown, contentType: string = "application/json"): MockBody {
  return {
    contentType,
    rawContent: createResolver(content),
  };
}

function createResolver(content: unknown): Resolver {
  return {
    serialize: (config: ResolverConfig) => {
      const expanded = expandDyns(content, config);
      return JSON.stringify(expanded);
    },
  };
}

/**
 * Sends the provided XML string in a MockResponse body.
 * The XML declaration prefix will automatically be added to xmlString.
 * @content Object to return as XML.
 * @returns {MockBody} response body with application/xml content type.
 */
export function xml(xmlString: string): MockBody {
  return {
    contentType: "application/xml",
    rawContent: `<?xml version='1.0' encoding='UTF-8'?>` + xmlString,
  };
}

export function multipart(
  config: Partial<Pick<MockMultipartBody, "contentType" | "parts" | "files">>,
): MockMultipartBody {
  return {
    kind: "multipart",
    contentType: "multipart/form-data",
    ...config,
  };
}

export interface DynValue<T extends string[]> {
  readonly isDyn: true;
  readonly keys: T;
  (dict: Record<T[number], string>): string;
}

/** Specify that this value is dynamic and needs to be interpolated with the given keys */
export function dyn<const T extends (keyof ResolverConfig)[]>(
  strings: readonly string[],
  ...keys: T
): DynValue<T> {
  const template = (dict: Record<T[number], string>) => {
    const result = [strings[0]];
    keys.forEach((key, i) => {
      const value = (dict as any)[key];
      if (value !== undefined) {
        result.push(value);
      }
      result.push(strings[i + 1]);
    });
    return result.join("");
  };
  template.keys = keys;
  template.isDyn = true as const;
  return template;
}

function expandDyns(value: unknown, config: ResolverConfig): unknown {
  if (typeof value === "string") {
    return value;
  } else if (Array.isArray(value)) {
    return value.map((v) => expandDyns(v, config));
  } else if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(Object.entries(obj).map(([key, v]) => [key, expandDyns(v, config)]));
  } else if (typeof value === "function") {
    if ("isDyn" in value && value.isDyn) {
      const dynValue = value as DynValue<string[]>;
      return dynValue(config as any);
    } else {
      throw new Error("Invalid function value");
    }
  }
  return value;
}
