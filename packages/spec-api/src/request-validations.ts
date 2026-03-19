import deepEqual from "deep-equal";
import { parseString } from "xml2js";
import { matchValues, type MockValueMatcher } from "./match-engine.js";
import { CollectionFormat, RequestExt, Resolver, ResolverConfig } from "./types.js";
import { ValidationError } from "./validation-error.js";

export const BODY_NOT_EQUAL_ERROR_MESSAGE = "Body provided doesn't match expected body";
export const BODY_EMPTY_ERROR_MESSAGE = "Body should exists";
export const BODY_NOT_EMPTY_ERROR_MESSAGE = "Body should be empty";

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

  if (!deepEqual(actualRawBody, expectedRawBody, { strict: true })) {
    throw new ValidationError(BODY_NOT_EQUAL_ERROR_MESSAGE, expectedRawBody, actualRawBody);
  }
};

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

export const validateXmlBodyEquals = (
  request: RequestExt,
  expectedBody: string | Resolver,
  config?: ResolverConfig,
): void => {
  const resolvedConfig = config ?? { baseUrl: "" };
  // When expectedBody is a Resolver (e.g. from xml`...`), serialize() already includes the XML declaration.
  // When it's a plain string, we need to prepend it.
  const expectedXml =
    typeof expectedBody === "string"
      ? `<?xml version='1.0' encoding='UTF-8'?>` + expectedBody
      : expectedBody.serialize(resolvedConfig);

  if (request.rawBody === undefined || isBodyEmpty(request.rawBody)) {
    throw new ValidationError(BODY_EMPTY_ERROR_MESSAGE, expectedXml, request.rawBody);
  }

  let actualParsed: unknown;
  parseString(request.rawBody, (err: Error | null, result: any): void => {
    if (err !== null) throw err;
    actualParsed = result;
  });

  let expectedParsed: unknown;
  parseString(expectedXml, (err: Error | null, result: any): void => {
    if (err !== null) throw err;
    expectedParsed = result;
  });

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
    if (!deepEqual(actualParsed, expectedParsed, { strict: true })) {
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
 * Check whether the request header contains the given name/value pair
 */
export const validateHeader = (request: RequestExt, headerName: string, expected: string): void => {
  const actual = request.headers[headerName];
  if (actual !== expected) {
    throw new ValidationError(`Expected ${expected} but got ${actual}`, expected, actual);
  }
};

/**
 * Check whether the query string contains the given parameter name and value.
 * Supports query param as string or collection. e.g. if it's a collection, one can call the method like this: validateQueryParam(request, ["a", "b", "c"], "multi")
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
      isExpected = deepEqual(actual, expected);
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
 * Check whether the value follow the right format.
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
