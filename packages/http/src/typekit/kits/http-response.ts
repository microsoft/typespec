import { isErrorModel } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import {
  HttpOperationResponseContent,
  HttpStatusCodeRange,
  HttpStatusCodesEntry,
} from "../../types.js";

interface HttpResponseKit {
  httpResponse: {
    /**
     * Check if the response is an error response.
     */
    isErrorResponse(response: HttpOperationResponseContent): boolean;
    statusCode: {
      isSingle(statusCode: HttpStatusCodesEntry): statusCode is number;
      isRange(statusCode: HttpStatusCodesEntry): statusCode is HttpStatusCodeRange;
      isDefault(statusCode: HttpStatusCodesEntry): statusCode is "*";
    };
  };
}

declare module "@typespec/compiler/typekit" {
  interface TypekitPrototype extends HttpResponseKit {}
}

defineKit<HttpResponseKit>({
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
