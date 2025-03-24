import { defineKit } from "@typespec/compiler/experimental/typekit";
import { HttpOperation, HttpProperty } from "@typespec/http";
import { resolvePropertyAccessPath } from "../../utils/operation-parameters.js";

/**
 * Utilities for working with http operations in the context of a client.
 * @experimental
 */
export interface SdkHttpOperation {
  /**
   * Returns a string that resolves to the parameter access for the given property.
   */
  formatParameterAccessExpression(httpOperation: HttpOperation, httpProperty: HttpProperty): string;
}

interface TypekitExtension {
  httpOperation: SdkHttpOperation;
}

declare module "@typespec/http/experimental/typekit" {
  interface HttpOperationKit extends SdkHttpOperation {}
}

defineKit<TypekitExtension>({
  httpOperation: {
    formatParameterAccessExpression(httpOperation, httpProperty) {
      return resolvePropertyAccessPath(httpOperation, httpProperty);
    },
  },
});
