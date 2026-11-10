import { XMLParser } from "fast-xml-parser";
import { isDeepStrictEqual } from "node:util";
import { matchValues, type MockValueMatcher } from "./match-engine.js";
import type { CollectionFormat, RequestExt, Resolver, ResolverConfig } from "./types.js";
import { ValidationError } from "./validation-error.js";

/** Base mismatch message; matcher-aware validators append the comparison detail. */
export const BODY_NOT_EQUAL_ERROR_MESSAGE = "Body provided doesn't match expected body";
/** Message used for a missing required body and for a nonempty raw body in validateBodyEmpty. */
export const BODY_EMPTY_ERROR_MESSAGE = "Body should exists";
/** Message used by validateBodyEmpty when a parsed Buffer contains unexpected bytes. */
export const BODY_NOT_EMPTY_ERROR_MESSAGE = "Body should be empty";

/**
 * Compares raw payloads without parsing or converting strings to Buffers.
 * An undefined expectation accepts an absent, empty-string or zero-length raw body.
 * @throws {ValidationError} when the raw payload differs.
 */
export const validateRawBodyEquals = (
  request: RequestExt,
  expectedRawBody: string | Buffer | undefined,
): void => {
  const actualRawBody = request.rawBody;

  if (expectedRawBody == null) {
    if (!isBodyEmpty(actualRawBody)) {
      throw new ValidationError(BODY_NOT_EQUAL_ERROR_MESSAGE, expectedRawBody, actualRawBody);
    }
    return;
  }

  if (!isDeepStrictEqual(actualRawBody, expectedRawBody)) {
    throw new ValidationError(BODY_NOT_EQUAL_ERROR_MESSAGE, expectedRawBody, actualRawBody);
  }
};

/**
 * Compares the parsed body with matchValues, allowing nested expected matchers.
 * A null or undefined expectation checks raw-body emptiness instead.
 * @throws {ValidationError} when the payload differs.
 */
export const validateBodyEquals = (
  request: RequestExt,
  expectedBody: unknown | undefined,
): void => {
  if (expectedBody == null) {
    if (!isBodyEmpty(request.rawBody)) {
      throw new ValidationError(BODY_NOT_EQUAL_ERROR_MESSAGE, expectedBody, request.rawBody);
    }
    return;
  }

  const result = matchValues(request.body, expectedBody);
  if (!result.pass) {
    throw new ValidationError(
      `${BODY_NOT_EQUAL_ERROR_MESSAGE}: ${result.message}`,
      expectedBody,
      request.body,
    );
  }
};

/**
 * Parses and compares XML bodies, ignoring declarations and using string-valued tag content.
 * A plain expected string is prefixed with an XML declaration; a Resolver supplies its
 * own serialized XML. Matchers collected from a dyn template replace matching parsed
 * text values before comparison.
 * @param expectedBody XML string or Resolver. For tagged xml results, pass the body's
 * Resolver-valued rawContent, not the MockBody wrapper.
 * @param config Dynamic-value context; defaults to an empty base URL.
 * @throws {ValidationError} when the raw body is empty or parsed values differ.
 */
export const validateXmlBodyEquals = (
  request: RequestExt,
  expectedBody: string | Resolver,
  config?: ResolverConfig,
): void => {
  const resolvedConfig = config ?? { baseUrl: "" };
  // A Resolver (e.g. a tagged XML body's rawContent) supplies its own XML declaration.
  // When it's a plain string, we need to prepend it.
  const expectedXml =
    typeof expectedBody === "string"
      ? `<?xml version='1.0' encoding='UTF-8'?>` + expectedBody
      : expectedBody.serialize(resolvedConfig);

  if (request.rawBody === undefined || isBodyEmpty(request.rawBody)) {
    throw new ValidationError(BODY_EMPTY_ERROR_MESSAGE, expectedXml, request.rawBody);
  }

  const parser = new XMLParser({ parseTagValue: false, ignoreDeclaration: true });
  const actualParsed: unknown = parser.parse(request.rawBody);
  let expectedParsed: unknown = parser.parse(expectedXml);

  // If the expected body is a DynValue with matchers, use matcher-aware comparison
  const matchers =
    typeof expectedBody !== "string" && "getMatchers" in expectedBody
      ? (expectedBody as any).getMatchers(resolvedConfig)
      : [];

  if (matchers.length > 0) {
    const matcherMap = new Map<string, MockValueMatcher>();
    for (const { serialized, matcher } of matchers) {
      matcherMap.set(serialized, matcher);
    }
    expectedParsed = substituteMatchers(expectedParsed, matcherMap);

    const result = matchValues(actualParsed, expectedParsed);
    if (!result.pass) {
      throw new ValidationError(
        `${BODY_NOT_EQUAL_ERROR_MESSAGE}: ${result.message}`,
        expectedXml,
        request.rawBody,
      );
    }
  } else {
    if (!isDeepStrictEqual(actualParsed, expectedParsed)) {
      throw new ValidationError(BODY_NOT_EQUAL_ERROR_MESSAGE, expectedXml, request.rawBody);
    }
  }
};

function substituteMatchers(value: unknown, matcherMap: Map<string, MockValueMatcher>): unknown {
  if (typeof value === "string") {
    return matcherMap.get(value) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => substituteMatchers(v, matcherMap));
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, substituteMatchers(v, matcherMap)]),
    );
  }
  return value;
}

/**
 * JSON-round-trips the actual body and normalizes UTC datetime strings before
 * matcher-aware comparison, leaving the expectation unchanged. Removes 3–7 fractional
 * digits and converts zero UTC offsets to `Z`; this is not general timezone conversion.
 * A null or undefined expectation checks raw-body emptiness.
 * @throws {ValidationError} when the payload differs.
 */
export const validateCoercedDateBodyEquals = (
  request: RequestExt,
  expectedBody: unknown | undefined,
): void => {
  if (expectedBody == null) {
    if (!isBodyEmpty(request.rawBody)) {
      throw new ValidationError(BODY_NOT_EQUAL_ERROR_MESSAGE, expectedBody, request.rawBody);
    }
    return;
  }

  const result = matchValues(coerceDate(request.body), expectedBody);
  if (!result.pass) {
    throw new ValidationError(
      `${BODY_NOT_EQUAL_ERROR_MESSAGE}: ${result.message}`,
      expectedBody,
      request.body,
    );
  }
};

/**
 * Requires an absent or zero-length raw body and rejects a nonempty parsed Buffer.
 * Parsed non-Buffer values do not determine emptiness.
 * @throws {ValidationError} when a body is present.
 */
export const validateBodyEmpty = (request: RequestExt): void => {
  if (isBodyEmpty(request.rawBody)) {
    if (request.body instanceof Buffer) {
      if (request.body.length > 0) {
        throw new ValidationError(BODY_NOT_EMPTY_ERROR_MESSAGE, undefined, request.rawBody);
      }
    }
  } else {
    throw new ValidationError(BODY_EMPTY_ERROR_MESSAGE, undefined, request.rawBody);
  }
};

/**
 * Requires a nonempty raw body or, when rawBody is empty, a nonempty parsed Buffer.
 * @throws {ValidationError} when neither payload contains content.
 */
export const validateBodyNotEmpty = (request: RequestExt): void => {
  if (isBodyEmpty(request.rawBody)) {
    if (request.body instanceof Buffer) {
      if (request.body.length === 0) {
        throw new ValidationError(BODY_EMPTY_ERROR_MESSAGE, undefined, request.rawBody);
      }
    } else {
      throw new ValidationError(BODY_EMPTY_ERROR_MESSAGE, undefined, request.rawBody);
    }
  }
};

/**
 * Check if the provided body is empty.
 * @param body express.js request body.
 */
const isBodyEmpty = (body: string | Buffer | undefined | null) => {
  return body == null || body === "" || body.length === 0;
};

/**
 * Requires strict equality of one parsed header value. Use a lowercase header name;
 * names and values are not normalized here, and unrelated headers are ignored.
 * @throws {ValidationError} when the header is absent or differs.
 */
export const validateHeader = (request: RequestExt, headerName: string, expected: string): void => {
  const actual = request.headers[headerName];
  if (actual !== expected) {
    throw new ValidationError(`Expected ${expected} but got ${actual}`, expected, actual);
  }
};

/**
 * Checks one parsed query parameter, leaving unrelated parameters unchecked.
 * String expectations use strict equality. For arrays, `multi` requires a matching
 * array in the same order; delimiter formats join expected elements and compare
 * against the URI-decoded actual string. Supply a collection format for array values.
 * @throws {ValidationError} when the parameter is absent or differs.
 */
export const validateQueryParam = (
  request: RequestExt,
  paramName: string,
  expected: string | string[],
  collectionFormat?: CollectionFormat,
): void => {
  const actual = request.query[paramName];
  const splitterMap = {
    csv: ",",
    ssv: " ",
    tsv: "\t",
    pipes: "|",
  };
  let isExpected = false;
  if (collectionFormat && Array.isArray(expected)) {
    // verify query parameter as collection
    if (collectionFormat === "multi" && Array.isArray(actual)) {
      isExpected = isDeepStrictEqual(actual, expected);
    } else if (collectionFormat !== "multi" && typeof actual === "string") {
      const expectedString = expected.join(splitterMap[collectionFormat]);
      isExpected = expectedString === decodeURIComponent(actual);
    }
    if (!isExpected) {
      throw new ValidationError(
        `Expected query param collection ${paramName}=${expected} in ${collectionFormat}, but got ${actual}`,
        expected,
        actual,
      );
    }
  } else if (actual !== expected) {
    throw new ValidationError(
      `Expected query param ${paramName}=${expected} but got ${actual}`,
      expected,
      actual,
    );
  }
};

const coerceDate = (targetObject: Record<string, unknown>): Record<string, unknown> => {
  let stringRep = JSON.stringify(targetObject);
  stringRep = stringRep.replace(
    /(\d\d\d\d-\d\d-\d\d[Tt]\d\d:\d\d:\d\d)(\.\d{3,7})?([Zz]|[+-]00:00)/g,
    "$1Z",
  );
  return JSON.parse(stringRep);
};

/**
 * Checks a string against the UUID, HTTP-date or RFC 3339 pattern used by the mock API.
 * This checks syntax, not calendar validity; the RFC 3339 pattern allows an omitted zone.
 * @throws {ValidationError} when the value fails the pattern or the format is unsupported.
 */
export const validateValueFormat = (
  value: string,
  format: "uuid" | "rfc7231" | "rfc3339",
): void => {
  switch (format) {
    case "uuid":
      if (!/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)) {
        throw new ValidationError(`Expected uuid format but got ${value}`, "uuid", value);
      }
      break;
    case "rfc7231":
      if (
        !/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s\d{2}\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT$/i.test(
          value,
        )
      ) {
        throw new ValidationError(`Expected rfc7231 format but got ${value}`, "rfc7231", value);
      }
      break;
    case "rfc3339":
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/i.test(value)) {
        throw new ValidationError(`Expected rfc3339 format but got ${value}`, "rfc3339", value);
      }
      break;
    default:
      throw new ValidationError(`Unsupported format ${format}`, format, value);
  }
};
