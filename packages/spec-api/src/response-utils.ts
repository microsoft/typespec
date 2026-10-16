import { isMatcher, type MockValueMatcher } from "./match-engine.js";
import type { MockBody, MockMultipartBody, Resolver, ResolverConfig } from "./types.js";

/**
 * Creates a deferred JSON body for a response or request expectation. Dynamic values
 * are expanded at serialization time. Its resolver preserves matcher objects in structured
 * JSON values for comparison; matchers inside dyn strings become text.
 * @param content Value to JSON-stringify after dynamic expansion.
 * @param contentType Media type; defaults to `application/json`.
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
 * For XML assertions, pass the tagged result's Resolver-valued rawContent, not the
 * MockBody wrapper. Validation collects matchers through getMatchers separately from
 * serializing the XML; calling resolve on the template instead returns a string.
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
/** Creates a MockBody with a template Resolver in rawContent for server-context expansion. */
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

/**
 * Describes multipart request inputs for service-call generation, defaulting to
 * `multipart/form-data`. Non-file parts are JSON-stringified and files retain their bytes.
 * Incoming multipart requests require a custom validation handler.
 */
export function multipart(
  config: Partial<Pick<MockMultipartBody, "contentType" | "parts" | "files">>,
): MockMultipartBody {
  return {
    kind: "multipart",
    contentType: "multipart/form-data",
    ...config,
  };
}

/**
 * Deferred template whose call, serialize and resolve all produce the same expanded string.
 * Matcher objects are not preserved in that string; getMatchers provides a separate list
 * for XML validation.
 */
export interface DynValue extends Resolver {
  readonly isDyn: true;
  /** Expands interpolations and concatenates them as strings without caching the result. */
  (config: ResolverConfig): string;
  /** Collects interpolated matchers, including those in nested dyn templates, with serialized text. */
  getMatchers(config: ResolverConfig): Array<{
    /** Text produced for this matcher in the supplied server context. */
    serialized: string;
    /** Original matcher retained for validating the corresponding parsed XML value. */
    matcher: MockValueMatcher;
  }>;
}

/** Placeholder returned by dynItem for a value supplied when a template is expanded. */
export interface DynItem<T extends keyof ResolverConfig> {
  readonly isDyn: true;
  readonly name: T;
}

/**
 * Selects a runtime context value without reading it yet.
 * @example
 * ```ts
 * dyn`${dynItem("baseUrl")}/next`
 * ```
 */
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

/** Controls whether expansion produces wire values or retains matchers for comparison. */
export interface ExpandDynsOptions {
  /** Serializes matchers using the supplied config by default; false preserves matcher objects. */
  resolveMatchers?: boolean;
}

/**
 * Recursively expands all dynamic values.
 * - Dyn functions are called with the config.
 * - By default, matchers (e.g. `match.localUrl`) are expanded via `serialize(config)`.
 *   Pass `{ resolveMatchers: false }` to preserve matchers for use with `matchValues`.
 * Arrays and enumerable object entries are rebuilt without mutating the input.
 * Values inside dyn strings are still stringified even when matchers are preserved elsewhere.
 * @throws {Error} if a function value is encountered that was not created by dyn.
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
