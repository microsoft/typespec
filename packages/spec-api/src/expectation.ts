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
import { CollectionFormat, RequestExt, Resolver, ResolverConfig } from "./types.js";
import { ValidationError } from "./validation-error.js";

/**
 * Class containing all the expectations that can be run on the request.
 */
export class RequestExpectation {
  public constructor(private originalRequest: RequestExt) {}
  /**
   * Expect the raw body of the request to match the given string.
   * @param rawBody Raw request body.
   * @throws {ValidationError} if there is an error.
   */
  public rawBodyEquals(expectedRawBody: string | Buffer | undefined): void {
    validateRawBodyEquals(this.originalRequest, expectedRawBody);
  }

  /**
   * Expect the body of the request to match the given object.
   * @param rawBody Raw request body.
   * @throws {ValidationError} if there is an error.
   */
  public bodyEquals(expectedRawBody: unknown | undefined): void {
    validateBodyEquals(this.originalRequest, expectedRawBody);
  }

  /**
   * Expect the coerced body of the request to match the given object.
   * @param rawBody Raw request body.
   * @throws {ValidationError} if there is an error.
   */
  public coercedBodyEquals(expectedRawBody: unknown | undefined): void {
    validateCoercedDateBodyEquals(this.originalRequest, expectedRawBody);
  }

  /**
   * Expect the body of the request to be empty.
   * @throws {ValidationError} if there is an error.
   */
  public bodyEmpty(): void {
    validateBodyEmpty(this.originalRequest);
  }

  /**
   * Expect the body of the request to be not empty.
   * @throws {ValidationError} if there is an error.
   */
  public bodyNotEmpty(): void {
    validateBodyNotEmpty(this.originalRequest);
  }

  /**
   * Expect the header of the request contains the expected key/value pair
   * @param headerName Key expected in header
   * @param expectedValue Values expected in header
   * @throws {ValidationError} if there is an error.
   */
  public containsHeader(headerName: string, expectedValue: string): void {
    validateHeader(this.originalRequest, headerName, expectedValue);
  }

  /**
   * Expect the query string of the request contains the expected name/value pair.
   * @param paramName Name of the query parameter.
   * @param expectedValue Value expected of the query parameter.
   */
  public containsQueryParam(
    paramName: string,
    expectedValue: string | string[],
    collectionFormat?: CollectionFormat,
  ): void {
    validateQueryParam(this.originalRequest, paramName, expectedValue, collectionFormat);
  }

  /**
   * Check if two requests are equal
   * @param actual Actual value
   * @param expected Expected value
   */
  public deepEqual(actual: unknown, expected: unknown, message = "Values not deep equal"): void {
    const result = matchValues(actual, expected);
    if (!result.pass) {
      throw new ValidationError(`${message}: ${result.message}`, expected, actual);
    }
  }

  /**
   * Expect the body of the request to be semantically equivalent to the provided XML.
   * Accepts a plain string or a Resolver (e.g. from `xml\`...\``).
   * When a Resolver with matchers is provided, matcher-aware comparison is used.
   * The XML declaration prefix will automatically be added.
   * @param expectedBody expected XML body as a string or Resolver.
   * @param config resolver config (required when expectedBody is a Resolver).
   * @throws {ValidationError} if there is an error.
   */
  public xmlBodyEquals(expectedBody: string | Resolver, config?: ResolverConfig): void {
    validateXmlBodyEquals(this.originalRequest, expectedBody, config);
  }
}
