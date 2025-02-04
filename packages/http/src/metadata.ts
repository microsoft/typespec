import { compilerAssert, ModelProperty, Program } from "@typespec/compiler";
import {
  isBody,
  isBodyRoot,
  isCookieParam,
  isHeader,
  isMultipartBodyProperty,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "./decorators.js";
import { HttpPayloadDisposition } from "./payload.js";

/**
 * Determines if a property is metadata. A property is defined to be
 * metadata if it is marked `@header`, `@cookie`, `@query`, `@path`, or `@statusCode`.
 */
export function isMetadata(program: Program, property: ModelProperty) {
  return (
    isHeader(program, property) ||
    isCookieParam(program, property) ||
    isQueryParam(program, property) ||
    isPathParam(program, property) ||
    isStatusCode(program, property)
  );
}

/**
 * Determines if the given property is metadata that is applicable with the
 * given visibility.
 *
 * - No metadata is applicable with Visibility.Item present.
 * - If only Visibility.Read is present, then only `@header` and `@status`
 *   properties are applicable.
 * - If Visibility.Read is not present, all metadata properties other than
 *   `@statusCode` are applicable.
 */
export function isApplicableMetadata(
  program: Program,
  property: ModelProperty,
  disposition: HttpPayloadDisposition,
  isMetadataCallback = isMetadata,
) {
  return isApplicableMetadataCore(program, property, false, disposition, isMetadataCallback);
}

/**
 * Determines if the given property is metadata or marked `@body` and
 * applicable with the given visibility.
 */
export function isApplicableMetadataOrBody(
  program: Program,
  property: ModelProperty,
  disposition: HttpPayloadDisposition,
  isMetadataCallback = isMetadata,
) {
  return isApplicableMetadataCore(program, property, true, disposition, isMetadataCallback);
}

function isApplicableMetadataCore(
  program: Program,
  property: ModelProperty,
  treatBodyAsMetadata: boolean,
  disposition: HttpPayloadDisposition,
  isMetadataCallback: (program: Program, property: ModelProperty) => boolean,
) {
  if (
    treatBodyAsMetadata &&
    (isBody(program, property) ||
      isBodyRoot(program, property) ||
      isMultipartBodyProperty(program, property))
  ) {
    return true;
  }

  if (!isMetadataCallback(program, property)) {
    return false;
  }

  switch (disposition) {
    case HttpPayloadDisposition.Request:
      return isRequestMetadata(program, property);
    case HttpPayloadDisposition.Response:
      return isResponseMetadata(program, property);
    case HttpPayloadDisposition.Multipart:
      return isMultipartMetadata(program, property);
    default:
      compilerAssert(false, `Unexpected HTTP payload disposition: ${disposition satisfies never}`);
  }
}

/**
 * Returns true if the parameter is metadata in a request.
 *
 * Requests can contain metadata in the form of query parameters, path parameters, and headers.
 *
 * @param program - the Program in which the property occurs
 * @param property - the property to check for metadata
 * @returns - true if the property is metadata in a request
 */
function isRequestMetadata(program: Program, property: ModelProperty) {
  return (
    isQueryParam(program, property) || isPathParam(program, property) || isHeader(program, property)
  );
}

/**
 * Returns true if the parameter is metadata in a response.
 *
 * Responses can contain metadata in the form of response headers and status codes.
 *
 * @param program - the Program in which the property occurs
 * @param property - the property to check for metadata
 * @returns - true if the property is metadata in a response
 */
function isResponseMetadata(program: Program, property: ModelProperty) {
  return isHeader(program, property) || isStatusCode(program, property);
}

/**
 * Returns true if the parameter is metadata in a multipart request.
 *
 * The only form of metadata supported in multipart requests is headers.
 *
 * @param program - the Program in which the property occurs
 * @param property - the property to check for metadata
 * @returns - true if the property is metadata in a multipart request
 */
function isMultipartMetadata(program: Program, property: ModelProperty) {
  return isHeader(program, property);
}
