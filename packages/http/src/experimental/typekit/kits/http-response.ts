import { isErrorModel } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/experimental/typekit";
import {
  HttpOperationResponseContent,
  HttpStatusCodeRange,
  HttpStatusCodesEntry,
} from "../../../types.js";

/**
 * Utilities for working with HTTP responses.
 * @experimental
 */
export interface HttpResponseKit {
    /**
     * Check if the response is an error response.
     */
    isErrorResponse(response: HttpOperationResponseContent): boolean;
    /**
     * utilities to perform checks on status codes
     */
    statusCode: {
      /**
       * Check if the status code is a single status code
       * @param statusCode status code to check
       */
      isSingle(statusCode: HttpStatusCodesEntry): statusCode is number;
      /**
       * Check if the status code is a range of status codes
       * @param statusCode status code to check
       */
      isRange(statusCode: HttpStatusCodesEntry): statusCode is HttpStatusCodeRange;
      /**
       * Check if the status code is a default status code
       * @param statusCode status code to check
       */
      isDefault(statusCode: HttpStatusCodesEntry): statusCode is "*";
    };
}

interface TypekitExtension {
  /**
   * Utilities for working with HTTP responses.
   * @experimental
   */
  httpResponse: HttpResponseKit;
}

declare module "@typespec/compiler/experimental/typekit" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  httpResponse: {
    isErrorResponse(response) {
      return response.body ? isErrorModel(this.program, response.body.type) : false;
    },
    statusCode: {
      isSingle(statusCode) {
        return typeof statusCode === "number";
      },
      isRange(statusCode) {
        return typeof statusCode === "object" && "start" in statusCode && "end" in statusCode;
      },
      isDefault(statusCode) {
        return statusCode === "*";
      },
    },
  },
});
