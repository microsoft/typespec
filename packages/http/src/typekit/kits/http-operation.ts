import { ignoreDiagnostics, Operation, StringLiteral } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { getHttpOperation } from "../../operations.js";
import { HttpOperation, HttpOperationResponseContent, HttpStatusCodesEntry } from "../../types.js";

/**
 * Structure of a flat HTTP response, which is grouped by status code and content type.
 */
export interface FlatHttpResponse {
  /**
   * Response status code.
   */
  statusCode: HttpStatusCodesEntry;
  /**
   * Content type. Might be undefined if the response does not have a body.
   */
  contentType?: string;
  /**
   * Response content.
   */
  responseContent: HttpOperationResponseContent;
}

interface HttpOperationKit {
  httpOperation: {
    /**
     * Get the corresponding HTTP operation for the given TypeSpec operation. The same
     * TypeSpec operation will always return the exact same HttpOperation object.
     *
     * @param op The TypeSpec operation to get the HTTP operation metadata for.
     */
    get(op: Operation): HttpOperation;
    /**
     * Get the responses for the given operation. This function will return an array of responses grouped by status code and content type.
     * @param op operation to extract the HttpResponse from
     */
    getResponses(op: Operation): FlatHttpResponse[];
  };
}

declare module "@typespec/compiler/typekit" {
  interface TypekitPrototype extends HttpOperationKit {}
}

defineKit<HttpOperationKit>({
  httpOperation: {
    get(op) {
      return ignoreDiagnostics(getHttpOperation(this.program, op));
    },
    getResponses(operation) {
      const responsesMap: FlatHttpResponse[] = [];
      const httpOperation = this.httpOperation.get(operation);
      for (const response of httpOperation.responses) {
        for (const responseContent of response.responses) {
          const contentTypeProperty = responseContent.properties.find(
            (property) => property.kind === "contentType"
          );

          let contentType: string | undefined;

          if (contentTypeProperty) {
            contentType = (contentTypeProperty.property.type as StringLiteral).value;
          } else if (responseContent.body) {
            contentType = "application/json";
          }

          responsesMap.push({ statusCode: response.statusCodes, contentType, responseContent });
        }
      }

      return responsesMap;
    },
  },
});
