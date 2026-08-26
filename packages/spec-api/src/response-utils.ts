import { isMatcher, type MockValueMatcher } from "./match-engine.js";
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
      // Preserve matchers so matchValues can use them for flexible validation
      return expandDyns(content, config, { resolveMatchers: false });
    },
  };
}

const XML_DECLARATION = `<?xml version='1.0' encoding='UTF-8'?>`;

/**
 * Sends the provided XML content in a MockResponse body.
 * The XML declaration prefix is automatically prepended.
 *
 * Can be used as a plain function or as a tagged template literal.
 * When used as a tagged template, interpolated matchers (e.g. `match.localUrl`)
 * are resolved at serialization time via `expandDyns`.
 *
 * @example
 * ```ts
 * // Plain string
 * xml("<Root>hello</Root>")
 *
 * // Tagged template with matcher
 * xml`<Root><Link>${match.localUrl("/next")}</Link></Root>`
 * ```
 *
 * @returns {MockBody} response body with application/xml content type.
 */
export function xml(content: string): MockBody;
export function xml(strings: TemplateStringsArray, ...values: unknown[]): MockBody;
export function xml(content: string | TemplateStringsArray, ...values: unknown[]): MockBody {
  if (typeof content !== "string") {
    return {
      contentType: "application/xml",
      rawContent: dyn`${XML_DECLARATION}${dyn(content, ...values)}`,
    };
  }

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

export interface DynValue extends Resolver {
  readonly isDyn: true;
  (config: ResolverConfig): string;
  /** Returns all matchers embedded in this template with their serialized values. */
  getMatchers(config: ResolverConfig): Array<{ serialized: string; matcher: MockValueMatcher }>;
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

/**
 * Tagged template for building strings with deferred resolution.
 * Interpolated values can be:
 * - `dynItem("baseUrl")` — resolved from `ResolverConfig`
 * - Matchers (e.g. `match.localUrl(...)`) — resolved via `expandDyns`
 * - Other `dyn` templates — recursively resolved
 * - Plain strings/numbers — used as-is
 */
export function dyn(strings: readonly string[], ...values: unknown[]): DynValue {
  const template = (config: ResolverConfig) => {
    let result = strings[0];
    values.forEach((v, i) => {
      result += String(expandDyns(v, config));
      result += strings[i + 1];
    });
    return result;
  };
  template.isDyn = true as const;
  template.serialize = template;
  template.resolve = template;
  template.getMatchers = (config: ResolverConfig) => {
    const result: Array<{ serialized: string; matcher: MockValueMatcher }> = [];
    for (const v of values) {
      collectMatchers(v, config, result);
    }
    return result;
  };
  return template;
}

function collectMatchers(
  value: unknown,
  config: ResolverConfig,
  out: Array<{ serialized: string; matcher: MockValueMatcher }>,
): void {
  if (isMatcher(value)) {
    out.push({ serialized: String(value.serialize(config)), matcher: value });
  } else if (typeof value === "function" && "isDyn" in value && value.isDyn) {
    const dynVal = value as DynValue;
    if (dynVal.getMatchers) {
      out.push(...dynVal.getMatchers(config));
    }
  }
}

export interface ExpandDynsOptions {
  /** When true, matchers are resolved to their `toJSON()` value. Default: true. */
  resolveMatchers?: boolean;
}

/**
 * Recursively expands all dynamic values.
 * - Dyn functions are called with the config.
 * - Resolvable matchers (e.g. `match.localUrl`) are resolved via `resolve(config)`.
 * - By default, matchers are resolved to their `toJSON()` plain value.
 *   Pass `{ resolveMatchers: false }` to preserve matchers for use with `matchValues`.
 */
export function expandDyns<T>(value: T, config: ResolverConfig, options?: ExpandDynsOptions): T {
  const resolve = options?.resolveMatchers ?? true;
  return _expandDyns(value, config, resolve);
}

function _expandDyns<T>(value: T, config: ResolverConfig, resolveMatchers: boolean): T {
  if (typeof value === "string") {
    return value;
  } else if (Array.isArray(value)) {
    return value.map((v) => _expandDyns(v, config, resolveMatchers)) as any;
  } else if (typeof value === "object" && value !== null) {
    // DynItem — resolve from config
    if ("isDyn" in value && (value as any).isDyn && "name" in value) {
      return (config as any)[(value as any).name] as any;
    }
    if (isMatcher(value)) {
      return resolveMatchers ? (value.serialize(config) as any) : (value as any);
    }
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(obj).map(([key, v]) => [key, _expandDyns(v, config, resolveMatchers)]),
    ) as any;
  } else if (typeof value === "function") {
    if ("isDyn" in value && value.isDyn) {
      const dynValue = value as any as DynValue;
      return dynValue(config) as any;
    } else {
      throw new Error("Invalid function value");
    }
  }
  return value;
}
