import { matchValues } from "./match-engine.js";
import {
  validateBodyEmpty,
  validateBodyEquals,
  validateBodyNotEmpty,
  validateCoercedDateBodyEquals,
  validateHeader,
  validateQueryParam,
  validateRawBodyEquals,
  validateXmlBodyEquals,
} from "./request-validations.js";
import type { CollectionFormat, RequestExt, Resolver, ResolverConfig } from "./types.js";
import { ValidationError } from "./validation-error.js";

/**
 * Assertions against one incoming request. A mismatch throws {@link ValidationError}
 * with expected and actual values; successful assertions return normally.
 */
export class RequestExpectation {
  /** Binds assertions to the supplied request without copying its data. */
  public constructor(private originalRequest: RequestExt) {}
  /**
   * Requires strict equality of raw strings or Buffer bytes, without converting between them.
   * An undefined expectation requires an empty raw payload.
   * @throws {ValidationError} when the payload differs.
   */
  public rawBodyEquals(expectedRawBody: string | Buffer | undefined): void {
    validateRawBodyEquals(this.originalRequest, expectedRawBody);
  }

  /**
   * Compares the parsed body using {@link matchValues}, including nested value matchers.
   * A null or undefined expectation instead requires an empty raw payload.
   * @throws {ValidationError} when the payload differs.
   */
  public bodyEquals(expectedRawBody: unknown | undefined): void {
    validateBodyEquals(this.originalRequest, expectedRawBody);
  }

  /**
   * JSON-round-trips the actual body and normalizes UTC datetime strings before
   * matcher-aware comparison. Removes 3–7 fractional digits and replaces zero offsets
   * with `Z`; the expected value is not normalized.
   * A null or undefined expectation requires an empty raw payload.
   * @throws {ValidationError} when the payload differs.
   */
  public coercedBodyEquals(expectedRawBody: unknown | undefined): void {
    validateCoercedDateBodyEquals(this.originalRequest, expectedRawBody);
  }

  /**
   * Requires an empty raw body and rejects a nonempty parsed Buffer.
   * Other parsed values do not determine emptiness.
   * @throws {ValidationError} when a body is present.
   */
  public bodyEmpty(): void {
    validateBodyEmpty(this.originalRequest);
  }

  /**
   * Requires a nonempty raw payload, falling back to the parsed Buffer when rawBody is empty.
   * @throws {ValidationError} if there is an error.
   */
  public bodyNotEmpty(): void {
    validateBodyNotEmpty(this.originalRequest);
  }

  /**
   * Requires the parsed header value to equal the expected string exactly.
   * Use a lowercase header name; other headers are not checked.
   * @throws {ValidationError} when the header is absent or differs.
   */
  public containsHeader(headerName: string, expectedValue: string): void {
    validateHeader(this.originalRequest, headerName, expectedValue);
  }

  /**
   * Requires a query parameter to equal the expected string or encoded collection.
   * For arrays, specify `multi` for repeated parameters or a delimiter format;
   * array element order is significant. Other query parameters are not checked.
   * @throws {ValidationError} when the parameter is absent or differs.
   */
  public containsQueryParam(
    paramName: string,
    expectedValue: string | string[],
    collectionFormat?: CollectionFormat,
  ): void {
    validateQueryParam(this.originalRequest, paramName, expectedValue, collectionFormat);
  }

  /**
   * Compares arbitrary values using {@link matchValues}, accepting matchers in the
   * expected tree. The failure message includes the first mismatching value's path.
   * @param message Prefix for the mismatch detail.
   * @throws {ValidationError} when the values do not match.
   */
  public deepEqual(actual: unknown, expected: unknown, message = "Values not deep equal"): void {
    const result = matchValues(actual, expected);
    if (!result.pass) {
      throw new ValidationError(`${message}: ${result.message}`, expected, actual);
    }
  }

  /**
   * Compares parsed XML using string-valued tag content. A dyn template preserves
   * embedded matchers for text-value comparison. Plain strings have an XML declaration
   * added; Resolvers supply their own serialized XML.
   * @param expectedBody Expected XML as a string or Resolver (for example, from the xml tag).
   * @param config Context for resolving dynamic values; defaults to an empty base URL.
   * @throws {ValidationError} if there is an error.
   */
  public xmlBodyEquals(expectedBody: string | Resolver, config?: ResolverConfig): void {
    validateXmlBodyEquals(this.originalRequest, expectedBody, config);
  }
}
