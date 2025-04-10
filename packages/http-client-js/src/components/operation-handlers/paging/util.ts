/**
 * This file contains utilities for handling paging operations in HTTP operations.
 * It provides functions to extract paging details for operations that utilize either
 * a nextLink or continuationToken paging pattern.
 */

import { ModelProperty, PagingOperation } from "@typespec/compiler";
import { HttpOperation } from "@typespec/http";

/**
 * Interface representing paging details for an operation.
 * The paging mechanism supports either the nextLink or continuationToken patterns.
 */
export interface PagingDetail {
  /**
   * Determines which paging pattern is used ("nextLink" or "continuationToken").
   */
  pattern: "nextLink" | "continuationToken";
  /**
   * Optionally specifies the parameter for sending the next token when calling the operation.
   */
  input?: {
    /**
     * The property name that provides the continuation token for the next page.
     */
    nextToken: string;
  };
  /**
   * Specifies the property name containing the list of items and optionally the token
   * indicating the next page in either headers or the body.
   */
  output: {
    /**
     * The property name that contains the list of items in the response.
     */
    items: string;
    /**
     * Optionally, information about the token indicating the next page.
     */
    nextToken?: {
      /**
       * The header or property name from which the token should be read.
       */
      name: string;
      /**
       * Specifies the location of the token: either in the HTTP headers or in the body.
       */
      position: "headers" | "body";
    };
  };
}

/**
 * Extracts paging details from an HTTP operation and a paging operation.
 *
 * This function analyzes the paging operation metadata and HTTP response structure to determine
 * if the paging token is provided via headers or in the response body. It then returns a PagingDetail
 * object containing both the input and output configurations for paging.
 *
 * @param httpOperation - The HTTP operation object containing response details.
 * @param pagingOperation - The paging operation metadata from which to extract paging configurations.
 * @returns A PagingDetail object containing the paging pattern, input and output configurations.
 */
export function extractPagingDetail(
  httpOperation: HttpOperation,
  pagingOperation: PagingOperation,
): PagingDetail {
  // Initialize the paging details with default "nextLink" pattern and map the items property.
  const ret: PagingDetail = {
    pattern: "nextLink",
    output: {
      items: pagingOperation.output.pageItems.property.name,
    },
  };

  // Determine the property associated with the next token output, trying first nextLink then continuationToken.
  const returnedNextToken =
    pagingOperation.output.nextLink?.property ?? pagingOperation.output.continuationToken?.property;

  // Determine if the paging token is provided in the HTTP headers.
  const isHeaderToken = getResponseHeader(httpOperation, returnedNextToken);
  // Set the token's position based on whether it was found in headers or not.
  const returnedTokenPosition = isHeaderToken ? "headers" : "body";
  // Determine the token name; if found in headers, use the header key; otherwise use the property name.
  const returnedTokenName = isHeaderToken ? isHeaderToken : returnedNextToken?.name;

  // If a next token and its name are identified, update the output configuration with nextToken details.
  if (returnedNextToken && returnedTokenName) {
    ret.output.nextToken = {
      name: returnedTokenName,
      position: returnedTokenPosition,
    };
  }

  // If a continuation token is defined in the paging operation, adjust the pattern to "continuationToken"
  // and configure the input nextToken parameter if present.
  if (pagingOperation.output.continuationToken) {
    ret.pattern = "continuationToken";
    if (pagingOperation.input.continuationToken) {
      ret.input = {
        nextToken: pagingOperation.input.continuationToken?.property.name,
      };
    }
    return ret;
  }
  return ret;
}

/**
 * Searches the HTTP operation responses for a header that corresponds to the given property.
 *
 * Iterates through all responses and their associated headers to find a header whose value matches
 * the provided ModelProperty. If found, returns the header's name.
 *
 * @param httpOperation - The HTTP operation containing the responses.
 * @param prop - The model property to search for within the HTTP response headers.
 * @returns The header name if the property is found in headers; otherwise, undefined.
 */
function getResponseHeader(httpOperation: HttpOperation, prop?: ModelProperty): string | undefined {
  if (!prop) {
    return undefined;
  }
  // Collect all headers from each response in the HTTP operation
  const headers = httpOperation.responses
    .flatMap((resp) => resp.responses)
    .map((resp) => resp.headers);
  // Iterate over each header collection
  for (const header of headers) {
    if (!header) {
      continue;
    }
    // Check each key in the header object to match the provided property
    for (const key in header) {
      if (header[key] === prop) {
        return key;
      }
    }
  }
  return undefined;
}
