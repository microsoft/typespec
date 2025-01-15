import { isErrorModel } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { HttpStatusCodeRange, HttpStatusCodesEntry } from "../../types.js";
import { FlatHttpResponse } from "./http-operation.js";

interface HttpResponseKit {
  /**
   * Check if the response is an error response.
   */
  isErrorResponse(response: FlatHttpResponse): boolean;
  statusCode: {
    isSingle(statusCode: HttpStatusCodesEntry): statusCode is number;
    isRange(statusCode: HttpStatusCodesEntry): statusCode is HttpStatusCodeRange;
    isDefault(statusCode: HttpStatusCodesEntry): statusCode is "*";
  };
}

interface TypekitExtension {
  httpResponse: HttpResponseKit;
}

declare module "@typespec/compiler/typekit" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  httpResponse: {
    isErrorResponse(response) {
      return this.model.is(response.type) ? isErrorModel(this.program, response.type) : false;
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
