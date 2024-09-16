import deepEqual from "deep-equal";
import * as prettier from "prettier";
import { parseString } from "xml2js";
import { CollectionFormat, RequestExt } from "./types.js";
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

  if (!deepEqual(request.body, expectedBody, { strict: true })) {
    throw new ValidationError(BODY_NOT_EQUAL_ERROR_MESSAGE, expectedBody, request.body);
  }
};

export const validateXmlBodyEquals = (request: RequestExt, expectedBody: string): void => {
  if (request.rawBody === undefined || isBodyEmpty(request.rawBody)) {
    throw new ValidationError(BODY_EMPTY_ERROR_MESSAGE, expectedBody, request.rawBody);
  }

  expectedBody = `<?xml version='1.0' encoding='UTF-8'?>` + expectedBody;

  let actualParsedBody = "";
  parseString(request.rawBody, (err: Error | null, result: any): void => {
    if (err !== null) {
      throw err;
    }
    actualParsedBody = result;
  });

  let expectedParsedBody = "";
  parseString(expectedBody, (err: Error | null, result: any): void => {
    if (err !== null) {
      throw err;
    }
    expectedParsedBody = result;
  });

  if (!deepEqual(actualParsedBody, expectedParsedBody, { strict: true })) {
    throw new ValidationError(
      BODY_NOT_EQUAL_ERROR_MESSAGE,
      prettier.format(expectedBody),
      prettier.format(request.body),
    );
  }
};

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

  if (!deepEqual(coerceDate(request.body), expectedBody, { strict: true })) {
    throw new ValidationError(BODY_NOT_EQUAL_ERROR_MESSAGE, expectedBody, request.body);
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
