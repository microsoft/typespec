import {
  createDiagnosticCollector,
  getMimeTypeHint,
  ignoreDiagnostics,
  Operation,
  Type,
  VoidType,
} from "@typespec/compiler";
import { defineKit, Typekit } from "@typespec/compiler/experimental/typekit";
import { getContentTypes } from "../../../content-types.js";
import { getHttpOperation } from "../../../operations.js";
import {
  HttpOperation,
  HttpOperationResponseContent,
  HttpStatusCodesEntry,
} from "../../../types.js";

/**
 * Utilities for working with HTTP operations.
 * @experimental
 */
export interface HttpOperationKit {
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
}

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
  contentTypes?: string[];
  /**
   * Response content.
   */
  responseContent: HttpOperationResponseContent;
}

interface TypekitExtension {
  /**
   * Utilities for working with HTTP operations.
   * @experimental
   */
  httpOperation: HttpOperationKit;
}

declare module "@typespec/compiler/experimental/typekit" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
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
              type: getEffectiveType(this, t),
            });
          }),
        });
      } else {
        httpReturnType = getEffectiveType(this, responses[0].responseContent.body?.type);
      }

      return httpReturnType;
    },
    getResponses(operation) {
      const diagnostics = createDiagnosticCollector();
      const responsesMap: FlatHttpResponse[] = [];
      const httpOperation = this.httpOperation.get(operation);
      for (const response of httpOperation.responses) {
        for (const responseContent of response.responses) {
          const contentTypeProperty = responseContent.properties.find(
            (property) => property.kind === "contentType",
          );

          let contentTypes: string[] | undefined;

          const { body } = responseContent;

          if (contentTypeProperty) {
            contentTypes = diagnostics.pipe(getContentTypes(contentTypeProperty.property));
          } else if (body) {
            // In this default case, we will fall back to the preferred MIME type of the body.
            contentTypes = [getMimeTypeHint(this.program, body.type) ?? "application/json"];
          }

          responsesMap.push({ statusCode: response.statusCodes, contentTypes, responseContent });
        }
      }

      return responsesMap;
    },
  },
});

function getEffectiveType(typekit: Typekit, type?: Type): Type {
  if (type === undefined) {
    return { kind: "Intrinsic", name: "void" } as VoidType;
  }
  if (typekit.model.is(type)) {
    return typekit.model.getEffectiveModel(type);
  }

  return type;
}
