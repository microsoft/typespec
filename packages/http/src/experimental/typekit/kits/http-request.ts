import { Model, ModelProperty } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { HttpOperation } from "../../../types.js";

export type HttpRequestParameterKind = "query" | "header" | "path" | "contentType" | "body";

/**
 * Utilities for working with HTTP Requests operations.
 * @typekit httpRequest
 * @experimental
 */
interface HttpRequestKit {
  body: {
    /**
     * Checks the body is a property explicitly tagged with @body @bodyRoot or @multipartBody
     * @param httpOperation the http operation to check
     */
    isExplicit(httpOperation: HttpOperation): boolean;
  };
  /**
   * Gets a Model representing the body parameters of an http operation.
   * @param httpOperation the http operation to get the body parameters from
   */
  getBodyParameters(httpOperation: HttpOperation): Model | undefined;
  /**
   * Gets a Model representing the parameters of an http operation.
   * @param httpOperation The Http operation to get the parameters from.
   * @param kind A string to filters specific parameter kinds, or an array to combine multiple kinds.
   */
  getParameters(
    httpOperation: HttpOperation,
    kind: HttpRequestParameterKind[] | HttpRequestParameterKind,
  ): Model | undefined;
}

interface TypekitExtension {
  httpRequest: HttpRequestKit;
}

declare module "@typespec/compiler/typekit" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  httpRequest: {
    body: {
      isExplicit(httpOperation: HttpOperation) {
        return (
          httpOperation.parameters.properties.find(
            (p) => p.kind === "body" || p.kind === "bodyRoot" || p.kind === "multipartBody",
          ) !== undefined
        );
      },
    },
    getBodyParameters(httpOperation: HttpOperation): Model | undefined {
      const body = httpOperation.parameters.body;

      if (!body) {
        return undefined;
      }

      const bodyProperty = body.property;

      if (!bodyProperty) {
        if (body.type.kind === "Model") {
          return body.type;
        }
        throw new Error("Body property not found");
      }

      const bodyPropertyName = bodyProperty.name ? bodyProperty.name : "body";

      return this.model.create({
        properties: { [bodyPropertyName]: bodyProperty },
      });
    },
    getParameters(
      httpOperation: HttpOperation,
      kind: HttpRequestParameterKind | HttpRequestParameterKind[],
    ): Model | undefined {
      const kinds = new Set(Array.isArray(kind) ? kind : [kind]);
      const parameterProperties = new Map<string, ModelProperty>();

      kinds.forEach((kind) => {
        if (kind === "body") {
          this.httpRequest
            .getBodyParameters(httpOperation)
            ?.properties.forEach((value, key) => parameterProperties.set(key, value));
        } else {
          httpOperation.parameters.properties
            .filter((p) => p.kind === kind && p.property)
            .forEach((p) => parameterProperties.set(p.property!.name, p.property!));
        }
      });

      if (parameterProperties.size === 0) {
        return undefined;
      }

      const properties = Object.fromEntries(parameterProperties);

      return this.model.create({ properties });
    },
  },
});
