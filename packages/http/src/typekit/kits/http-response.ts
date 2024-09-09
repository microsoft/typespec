import { defineKit } from "@typespec/compiler/typekit";
import { HttpStatusCodeRange, HttpStatusCodesEntry } from "../../types.js";

interface HttpResponseKit {
  httpResponse: {
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
