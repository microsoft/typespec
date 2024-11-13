import { ignoreDiagnostics, Operation, StringLiteral, Type, VoidType } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
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
    /**
     * Get the Http Return type for the given operation. This function will resolve the returnType based on the Http Operation.
     * @param op operation to get the return type for
     */
    getReturnType(op: Operation, options?: { includeErrors?: boolean }): Type;
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
    getReturnType(operation, options) {
      let responses = this.httpOperation.getResponses(operation);

      if (!options?.includeErrors) {
        responses = responses.filter((r) => !this.httpResponse.isErrorResponse(r.responseContent));
      }

      const voidType = { kind: "Intrinsic", name: "void" } as VoidType;
      let httpReturnType: Type = voidType;

      if (!responses.length) {
        return voidType;
      }

      if (responses.length > 1) {
        const res = [...new Set(responses.map((r) => r.responseContent.body?.type))];
        httpReturnType = this.union.create({
          variants: res.map((t) => {
            return this.unionVariant.create({
              type: getEffectiveType(t),
            });
          }),
        });
      } else {
        httpReturnType = getEffectiveType(responses[0].responseContent.body?.type);
      }

      return httpReturnType;
    },
    getResponses(operation) {
      const responsesMap: FlatHttpResponse[] = [];
      const httpOperation = this.httpOperation.get(operation);
      for (const response of httpOperation.responses) {
        for (const responseContent of response.responses) {
          const contentTypeProperty = responseContent.properties.find(
            (property) => property.kind === "contentType",
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

function getEffectiveType(type?: Type): Type {
  if (type === undefined) {
    return { kind: "Intrinsic", name: "void" } as VoidType;
  }
  if ($.model.is(type)) {
    return $.model.getEffectiveModel(type);
  }

  return type;
}
