import { isMatcher } from "./matchers.js";
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
    resolve: (config: ResolverConfig) => {
      return expandDyns(content, config);
    },
  };
}

const XML_DECLARATION = `<?xml version='1.0' encoding='UTF-8'?>`;

/**
 * Sends the provided XML content in a MockResponse body.
 * The XML declaration prefix is automatically prepended.
 *
 * Can be used as a plain function or as a tagged template literal.
 * When used as a tagged template, interpolated matchers (e.g. `match.baseUrl`)
 * are resolved at serialization time via `expandDyns`.
 *
 * @example
 * ```ts
 * // Plain string
 * xml("<Root>hello</Root>")
 *
 * // Tagged template with matcher
 * xml`<Root><Link>${match.baseUrl("/next")}</Link></Root>`
 * ```
 *
 * @returns {MockBody} response body with application/xml content type.
 */
export function xml(content: string): MockBody;
export function xml(strings: TemplateStringsArray, ...values: unknown[]): MockBody;
export function xml(
  content: string | TemplateStringsArray,
  ...values: unknown[]
): MockBody {
  // Tagged template literal: xml`...${match.baseUrl("/path")}...`
  if (typeof content !== "string") {
    const strings = content;
    const hasDynamic = values.some((v) => isMatcher(v));

    if (!hasDynamic) {
      // No matchers — concatenate to a static string
      let result = strings[0];
      values.forEach((v, i) => {
        result += String(v) + strings[i + 1];
      });
      return {
        contentType: "application/xml",
        rawContent: XML_DECLARATION + result,
      };
    }

    // Has matchers — create a resolver that resolves them at serialization time
    const resolveTemplate = (config: ResolverConfig): string => {
      let result = strings[0];
      values.forEach((v, i) => {
        const expanded = expandDyns(v, config);
        result += (isMatcher(expanded) ? String(expanded.toJSON()) : String(expanded)) + strings[i + 1];
      });
      return XML_DECLARATION + result;
    };
    return {
      contentType: "application/xml",
      rawContent: {
        serialize: resolveTemplate,
        resolve: resolveTemplate,
      },
    };
  }

  // Plain string
  return {
    contentType: "application/xml",
    rawContent: XML_DECLARATION + content,
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

export interface DynItem<T extends keyof ResolverConfig> {
  readonly isDyn: true;
  readonly name: T;
}

export function dynItem<const T extends keyof ResolverConfig>(name: T): DynItem<T> {
  return {
    isDyn: true,
    name,
  };
}

/** Specify that this value is dynamic and needs to be interpolated with the given keys */
export function dyn<const T extends (keyof ResolverConfig)[]>(
  strings: readonly string[],
  ...keys: (DynItem<T[number]> | string)[]
): DynValue<T> {
  const dynKeys: T = [] as any;
  const template = (dict: Record<T[number], string>) => {
    const result = [strings[0]];
    keys.forEach((key, i) => {
      if (typeof key === "string") {
        result.push(key);
      } else {
        dynKeys.push(key.name);
        const value = (dict as any)[key.name];
        if (value !== undefined) {
          result.push(value);
        }
      }
      result.push(strings[i + 1]);
    });
    return result.join("");
  };
  template.keys = dynKeys;
  template.isDyn = true as const;
  return template;
}

export function expandDyns<T>(value: T, config: ResolverConfig): T {
  if (typeof value === "string") {
    return value;
  } else if (Array.isArray(value)) {
    return value.map((v) => expandDyns(v, config)) as any;
  } else if (typeof value === "object" && value !== null) {
    if (isMatcher(value)) {
      if ("resolve" in value && typeof (value as any).resolve === "function") {
        return (value as any).resolve(config) as any;
      }
      return value as any;
    }
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(obj).map(([key, v]) => [key, expandDyns(v, config)]),
    ) as any;
  } else if (typeof value === "function") {
    if ("isDyn" in value && value.isDyn) {
      const dynValue = value as any as DynValue<string[]>;
      return dynValue(config as any) as any;
    } else {
      throw new Error("Invalid function value");
    }
  }
  return value;
}
